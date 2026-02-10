import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, ScanLine, Camera, User } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

type ScanResult = {
  status: 'success' | 'duplicate' | 'invalid';
  userName?: string;
  uid?: string;
  message: string;
};

export default function Verify() {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedBooth, setSelectedBooth] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  // Create success audio
  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    successAudioRef.current = null; // We'll use Web Audio API directly
    return () => { audioContext.close(); };
  }, []);

  const playSuccessSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* silent fail */ }
  }, []);

  const playErrorSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* silent fail */ }
  }, []);

  const { data: boothLocations } = useQuery({
    queryKey: ['booth-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booth_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleScan = useCallback(async (scannedUid: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Stop scanner temporarily
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.pause(true);
      }

      // Look up user by registration_uid
      const { data: profile, error: profileError } = await (supabase
        .from('profiles')
        .select('id, name, avatar_url, registration_uid') as any)
        .eq('registration_uid', scannedUid)
        .maybeSingle() as { data: { id: string; name: string; avatar_url: string | null; registration_uid: string } | null; error: any };

      if (profileError || !profile) {
        playErrorSound();
        setScanResult({
          status: 'invalid',
          uid: scannedUid,
          message: 'Invalid Ticket - No user found with this ID',
        });
        setIsProcessing(false);
        return;
      }

      // Check for duplicate scan (same user, same booth, within 5 minutes)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentScan } = await supabase
        .from('event_logs')
        .select('id')
        .eq('user_id', profile.id)
        .eq('booth_location', selectedBooth)
        .gte('scanned_at', fiveMinAgo)
        .maybeSingle();

      if (recentScan) {
        playErrorSound();
        setScanResult({
          status: 'duplicate',
          userName: profile.name,
          uid: scannedUid,
          message: 'Already Scanned Recently (within 5 minutes)',
        });
        setIsProcessing(false);
        return;
      }

      // Log the scan
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase
        .from('event_logs')
        .insert({
          user_id: profile.id,
          booth_location: selectedBooth,
          scanned_by: user!.id,
        });

      if (insertError) {
        console.error('Failed to log scan:', insertError);
        setScanResult({
          status: 'invalid',
          message: 'Failed to log entry. Please try again.',
        });
        setIsProcessing(false);
        return;
      }

      playSuccessSound();
      setScanResult({
        status: 'success',
        userName: profile.name,
        uid: scannedUid,
        message: 'Entry Verified Successfully!',
      });
    } catch (err) {
      console.error('Scan error:', err);
      setScanResult({
        status: 'invalid',
        message: 'An error occurred during verification',
      });
    }

    setIsProcessing(false);
  }, [isProcessing, selectedBooth, playSuccessSound, playErrorSound]);

  const startScanner = useCallback(async () => {
    setScanResult(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {} // ignore errors during scanning
      );
      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please grant permission.',
        variant: 'destructive',
      });
    }
  }, [handleScan, toast]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const resetAndResume = useCallback(async () => {
    setScanResult(null);
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.resume();
        } else {
          await startScanner();
        }
      } catch {
        await startScanner();
      }
    }
  }, [startScanner]);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  if (isLoading) {
    return <Layout><div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
              Booth Verification
            </h1>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              Scan visitor QR codes to verify entry
            </p>

            {/* Booth Selection */}
            {!selectedBooth ? (
              <Card className="border-border shadow-temple">
                <CardHeader>
                  <CardTitle className="text-lg">Select Your Booth</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={setSelectedBooth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose booth location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {boothLocations?.map((b) => (
                        <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Active Booth */}
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    📍 {selectedBooth}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => { stopScanner(); setSelectedBooth(''); }}>
                    Change Booth
                  </Button>
                </div>

                {/* Scanner Area */}
                <Card className="border-border shadow-temple overflow-hidden">
                  <CardContent className="p-0">
                    {/* QR Reader container */}
                    <div id="qr-reader" className={`w-full ${scanning && !scanResult ? '' : 'hidden'}`} />

                    {/* Scan Result Overlay */}
                    <AnimatePresence>
                      {scanResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`p-8 text-center ${
                            scanResult.status === 'success'
                              ? 'bg-primary/5'
                              : scanResult.status === 'duplicate'
                              ? 'bg-secondary/10'
                              : 'bg-destructive/5'
                          }`}
                        >
                          {scanResult.status === 'success' && (
                            <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-4" />
                          )}
                          {scanResult.status === 'duplicate' && (
                            <AlertTriangle className="w-20 h-20 text-secondary mx-auto mb-4" />
                          )}
                          {scanResult.status === 'invalid' && (
                            <XCircle className="w-20 h-20 text-destructive mx-auto mb-4" />
                          )}

                          {scanResult.userName && (
                            <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                              {scanResult.userName}
                            </h3>
                          )}
                          {scanResult.uid && (
                            <p className="text-sm text-muted-foreground mb-2 font-mono">{scanResult.uid}</p>
                          )}
                          <p className={`text-sm font-medium ${
                            scanResult.status === 'success' ? 'text-primary' :
                            scanResult.status === 'duplicate' ? 'text-secondary' :
                            'text-destructive'
                          }`}>
                            {scanResult.message}
                          </p>

                          <Button onClick={resetAndResume} className="mt-6" variant="outline">
                            <ScanLine className="w-4 h-4 mr-2" />
                            Scan Next
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Start Scanner */}
                    {!scanning && !scanResult && (
                      <div className="p-12 text-center">
                        <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Ready to scan QR codes</p>
                        <Button onClick={startScanner} className="bg-gradient-saffron text-primary-foreground">
                          <ScanLine className="w-4 h-4 mr-2" />
                          Start Scanner
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
