import { motion } from 'framer-motion';
import { Flame, Heart, Shield, BookOpen } from 'lucide-react';
const features = [{
  icon: Flame,
  title: 'वैदिक यज्ञ',
  description: 'शास्त्रीय विधि-विधान से आयोजित महायज्ञ विश्व कल्याण एवं राष्ट्र हित हेतु।'
}, {
  icon: Shield,
  title: 'राष्ट्र रक्षा',
  description: 'भ्रष्टाचार मुक्त, आर्थिक एवं आणविक दृष्टि से सुदृढ़ भारत के निर्माण हेतु संकल्प।'
}, {
  icon: Heart,
  title: 'सेवा कार्य',
  description: 'हॉस्पिटल, विद्यालय, गौशालाएं एवं वृद्ध जन सेवा के माध्यम से समाज सेवा।'
}, {
  icon: BookOpen,
  title: 'वेद प्रचार',
  description: 'संस्कृत शिक्षा एवं वैदिक ज्ञान का संरक्षण एवं प्रसार भावी पीढ़ियों हेतु।'
}];
export function AboutSection() {
  return <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            हमारा उद्देश्य
          </motion.span>
          <motion.h2 initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.1
        }} className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-normal">
            परोपकारार्थमिदं{' '}
            <span className="text-gradient-saffron font-sans">शरीरम्</span>
          </motion.h2>
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.2
        }} className="text-lg text-muted-foreground">
            वेद के शास्त्रीय मर्यादा के अनुरूप, राष्ट्र हित में किया जाने वाला कर्म ही धर्म है। 
            भारतीय वैदिक हिंदू धर्म संस्कृति के संरक्षण एवं विश्व कल्याण हेतु समर्पित।
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => <motion.div key={feature.title} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.1
        }} className="group p-6 lg:p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-saffron flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3 leading-normal">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>)}
        </div>
      </div>
    </section>;
}