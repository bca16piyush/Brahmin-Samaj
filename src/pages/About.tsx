import { motion } from 'framer-motion';
import { Heart, Book, Users, Award, Target, Globe, Flame, Shield } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
const values = [{
  icon: Flame,
  title: 'यज्ञ परंपरा',
  description: 'Preserving and conducting sacred Vedic yagyas as per shastriya maryada for world welfare.'
}, {
  icon: Shield,
  title: 'राष्ट्र हित',
  description: 'Every yagya is performed with the sacred resolve for national prosperity and protection.'
}, {
  icon: Book,
  title: 'वैदिक ज्ञान',
  description: 'Promoting Vedic education and preserving ancient knowledge for future generations.'
}, {
  icon: Heart,
  title: 'परोपकार',
  description: 'Selfless service through hospitals, schools, gaushalas, and humanitarian missions.'
}];
const stats = [{
  value: '9+',
  label: 'Lakh Chandi Mahayagyas'
}, {
  value: '7+',
  label: 'Ayut Chandi Mahayagyas'
}, {
  value: '1000+',
  label: 'Sahasra Chandi Yagyas'
}, {
  value: '35+',
  label: 'Years of Service'
}];
const achievements = ['Conducted Mahayagya during 1986 Haridwar Mahakumbh for world welfare', 'Organized yagyas for Ganga restoration at Kanpur ghats (1996)', 'Performed special yagyas for disaster relief after Kedarnath tragedy (2013)', 'Conducted Lakh Chandi Mahayagya in Varanasi (2015) for corruption-free India', 'Organized Koti Shri Mahayagya in Kanpur (2017) for industrial development', 'Performed yagya for COVID-19 eradication in Kashi (2022)', 'Established Sushil Koirala Prakhar Cancer Hospital in Nepal'];
export default function About() {
  return <Layout>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-cream to-background">
        <div className="container mx-auto px-4">
          
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-saffron flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="font-heading text-3xl font-bold">हमारा उद्देश्य</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                वेद के शास्त्रीय मर्यादा के अनुरूप, राष्ट्र हित में किया जाने वाला कर्म ही धर्म है। 
                भारतीय वैदिक हिंदू धर्म संस्कृति के संरक्षण, प्रचार-प्रसार एवं राष्ट्र हित के कार्यों हेतु 
                महायज्ञों का आयोजन करना।
              </p>
              <ul className="space-y-3">
                {['भ्रष्टाचार मुक्त आदर्श भारत राष्ट्र का निर्माण', 'देश को आर्थिक और आणविक दृष्टि से सुदृढ़ बनाना', 'भारत राष्ट्र को पुनः विश्व गुरु के रूप में स्थापित करना', 'वैदिक हिंदू सनातन धर्म संस्कृति का संरक्षण'].map(item => <li key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>)}
              </ul>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-gold" />
                </div>
                <h2 className="font-heading text-3xl font-bold">श्री प्रखर परोपकार मिशन</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                वर्ष 1999 में स्थापित, यह मिशन याज्ञिक अनुष्ठानों के अतिरिक्त अनेक सेवा कार्य संचालित करता है 
                - मल्टी-स्पेशियल्टी हॉस्पिटल, संस्कृत विद्यालय, आधुनिक विद्यालय (CBSE), वृद्ध जनों की सेवा के लिए HOPE, 
                कुंभ मेले में चैरिटेबल हॉस्पिटल, गौशालाएं आदि।
              </p>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-maroon/10 to-gold/10 border border-gold/20">
                <p className="text-lg font-heading italic text-foreground">
                  "परोपकारार्थमिदं शरीरम्"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  यह शरीर परोपकार के लिए है - गुरुदेव का जीवन इसी सिद्धांत का मूर्त रूप है।
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.h2 initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              महायज्ञों की <span className="text-gradient-saffron font-serif">गौरवशाली परंपरा</span>
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
            delay: 0.1
          }} className="text-lg text-muted-foreground">
              विश्व कल्याण एवं राष्ट्र हित में आयोजित प्रमुख महायज्ञ
            </motion.p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {achievements.map((achievement, index) => <motion.div key={index} initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="w-8 h-8 rounded-full bg-gradient-saffron flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Flame className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-foreground">{achievement}</p>
                </motion.div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.h2 initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              हमारे <span className="text-gradient-saffron">मूल्य</span>
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
            delay: 0.1
          }} className="text-lg text-muted-foreground">
              वे सिद्धांत जो हमारे प्रत्येक कार्य का मार्गदर्शन करते हैं
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => <motion.div key={value.title} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="p-6 rounded-2xl bg-card border border-border hover:shadow-temple transition-all text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-maroon">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => <motion.div key={stat.label} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="text-center">
                <p className="text-4xl md:text-5xl font-heading font-bold text-gold mb-2">
                  {stat.value}
                </p>
                <p className="text-primary-foreground/70">{stat.label}</p>
              </motion.div>)}
          </div>
        </div>
      </section>
    </Layout>;
}