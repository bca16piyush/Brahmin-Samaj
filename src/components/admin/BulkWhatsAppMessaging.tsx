import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Upload, FileText, Users, Clock, AlertCircle, CheckCircle, Image, Video, File, X, Paperclip } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Recipient {
  phone: string;
  name?: string;
  customFields?: Record<string, string>;
}

interface SendResult {
  phone: string;
  success: boolean;
  error?: string;
}

interface MediaAttachment {
  file: File;
  type: 'image' | 'video' | 'document' | 'pdf';
  preview?: string;
}

export function BulkWhatsAppMessaging() {
  const { toast } = useToast();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [title, setTitle] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('5');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [mediaAttachment, setMediaAttachment] = useState<MediaAttachment | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV file
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvError('CSV must have at least a header row and one data row');
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Find required phone column
        const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'mobile' || h === 'whatsapp');
        if (phoneIndex === -1) {
          setCsvError('CSV must have a column named "phone", "mobile", or "whatsapp"');
          return;
        }

        const nameIndex = headers.findIndex(h => h === 'name');

        // Parse data rows
        const parsedRecipients: Recipient[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const phone = values[phoneIndex];
          
          if (!phone || phone.length < 10) continue;

          const recipient: Recipient = {
            phone,
            name: nameIndex !== -1 ? values[nameIndex] : undefined,
            customFields: {},
          };

          // Add any custom fields
          headers.forEach((header, idx) => {
            if (idx !== phoneIndex && idx !== nameIndex && values[idx]) {
              recipient.customFields![header] = values[idx];
            }
          });

          parsedRecipients.push(recipient);
        }

        if (parsedRecipients.length === 0) {
          setCsvError('No valid phone numbers found in CSV');
          return;
        }

        setRecipients(parsedRecipients);
        toast({
          title: 'CSV Uploaded',
          description: `Found ${parsedRecipients.length} recipients`,
        });
      } catch (err) {
        setCsvError('Failed to parse CSV file');
        console.error(err);
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  }, [toast]);

  // Handle media file selection
  const handleMediaSelect = (type: 'image' | 'video' | 'document' | 'pdf') => {
    if (mediaInputRef.current) {
      let accept = '';
      switch (type) {
        case 'image':
          accept = 'image/jpeg,image/png,image/webp';
          break;
        case 'video':
          accept = 'video/mp4,video/3gpp';
          break;
        case 'pdf':
          accept = '.pdf';
          break;
        case 'document':
          accept = '.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
          break;
      }
      mediaInputRef.current.accept = accept;
      mediaInputRef.current.dataset.type = type;
      mediaInputRef.current.click();
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const type = (e.target.dataset.type as 'image' | 'video' | 'document' | 'pdf') || 'document';
    const file = files[0];

    // Check file size (max 16MB for WhatsApp media)
    const maxSize = type === 'video' ? 16 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Maximum size is ${type === 'video' ? '16MB' : '5MB'}`,
        variant: 'destructive',
      });
      return;
    }

    const newAttachment: MediaAttachment = { file, type };

    // Create preview for images
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => {
        newAttachment.preview = event.target?.result as string;
        setMediaAttachment(newAttachment);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaAttachment(newAttachment);
    }

    e.target.value = '';
  };

  const removeMediaAttachment = () => {
    setMediaAttachment(null);
  };

  // Send bulk messages
  const handleSendBulk = async () => {
    if (recipients.length === 0 || !title || !messageTemplate) {
      toast({
        title: 'Missing Information',
        description: 'Please upload recipients and fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setSendResults([]);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // If there's a media attachment, upload it first
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;

      if (mediaAttachment) {
        const fileName = `bulk-whatsapp/${Date.now()}-${mediaAttachment.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(fileName, mediaAttachment.file);

        if (uploadError) throw new Error('Failed to upload media file');

        const { data: publicUrl } = supabase.storage
          .from('gallery')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl.publicUrl;
        mediaType = mediaAttachment.type;
      }

      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setSendProgress(prev => Math.min(prev + 1, 95));
      }, (recipients.length * parseInt(delaySeconds) * 1000) / 100);

      const { data, error } = await supabase.functions.invoke('send-bulk-whatsapp', {
        body: {
          recipients,
          title,
          messageTemplate,
          delayMs: parseInt(delaySeconds) * 1000,
          mediaUrl,
          mediaType,
        },
      });

      clearInterval(progressInterval);
      setSendProgress(100);

      if (error) throw error;

      setSendResults(data.results || []);
      setShowResults(true);

      toast({
        title: 'Bulk Send Complete',
        description: `Sent: ${data.sent}, Failed: ${data.failed}`,
        variant: data.failed > 0 ? 'destructive' : 'default',
      });
    } catch (err) {
      console.error('Bulk send error:', err);
      toast({
        title: 'Send Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Clear all
  const handleReset = () => {
    setRecipients([]);
    setTitle('');
    setMessageTemplate('');
    setSendResults([]);
    setSendProgress(0);
    setCsvError(null);
    setMediaAttachment(null);
  };

  const availableTags = ['{name}', ...Object.keys(recipients[0]?.customFields || {}).map(k => `{${k}}`)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Bulk WhatsApp Messaging
          </CardTitle>
          <CardDescription>
            Upload a CSV file with recipients and send personalized messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CSV Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Recipients CSV
              </Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isSending}
                className="max-w-xs"
              />
            </div>

            {csvError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>CSV Error</AlertTitle>
                <AlertDescription>{csvError}</AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
              <p className="font-medium mb-2">CSV Format:</p>
              <code className="text-xs">phone,name,location,gotra</code>
              <br />
              <code className="text-xs">919876543210,Ram Kumar,Delhi,Kashyap</code>
              <p className="mt-2 text-xs">
                Required column: <strong>phone</strong> (or mobile/whatsapp).
                Optional: <strong>name</strong> and any custom fields.
              </p>
            </div>

            {recipients.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {recipients.length} Recipients Loaded
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setRecipients([])}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Message Composition */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Message Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 📢 Important Announcement"
                disabled={isSending}
              />
            </div>

            <div className="space-y-2">
              <Label>Message Template</Label>
              <Textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="नमस्कार {name}! You are invited to..."
                rows={5}
                disabled={isSending}
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Available tags:</span>
                {availableTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => setMessageTemplate(prev => prev + tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Media Attachment Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attach Media (Optional)
              </Label>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={mediaInputRef}
                className="hidden"
                onChange={handleMediaChange}
              />

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={isSending || mediaAttachment !== null}
                      className="gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      Add Media
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem onClick={() => handleMediaSelect('image')}>
                      <Image className="h-4 w-4 mr-2" />
                      Image (JPG, PNG)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMediaSelect('video')}>
                      <Video className="h-4 w-4 mr-2" />
                      Video (MP4)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMediaSelect('pdf')}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMediaSelect('document')}>
                      <File className="h-4 w-4 mr-2" />
                      Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Media preview */}
                {mediaAttachment && (
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    {mediaAttachment.type === 'image' && mediaAttachment.preview ? (
                      <img 
                        src={mediaAttachment.preview} 
                        alt="Preview" 
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : mediaAttachment.type === 'video' ? (
                      <Video className="h-5 w-5 text-primary" />
                    ) : mediaAttachment.type === 'pdf' ? (
                      <FileText className="h-5 w-5 text-destructive" />
                    ) : (
                      <File className="h-5 w-5 text-primary" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium max-w-[150px] truncate">
                        {mediaAttachment.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(mediaAttachment.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={removeMediaAttachment}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Max size: Images/Documents 5MB, Videos 16MB. Supported formats: JPG, PNG, MP4, PDF, DOC, XLS, PPT
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Delay Between Messages
              </Label>
              <Select value={delaySeconds} onValueChange={setDelaySeconds} disabled={isSending}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds (recommended)</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Estimated time: ~{Math.ceil(recipients.length * parseInt(delaySeconds) / 60)} minutes for {recipients.length} recipients
              </p>
            </div>
          </div>

          {/* Progress */}
          {isSending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sending messages...</span>
                <span>{sendProgress}%</span>
              </div>
              <Progress value={sendProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 border-t pt-4">
            <Button
              onClick={handleSendBulk}
              disabled={isSending || recipients.length === 0 || !title || !messageTemplate}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending...' : `Send to ${recipients.length} Recipients`}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSending}>
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Send Results
            </DialogTitle>
            <DialogDescription>
              {sendResults.filter(r => r.success).length} sent, {sendResults.filter(r => !r.success).length} failed
            </DialogDescription>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sendResults.map((result, idx) => (
                <TableRow key={idx}>
                  <TableCell>{result.phone}</TableCell>
                  <TableCell>
                    {result.success ? (
                      <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {result.error || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
