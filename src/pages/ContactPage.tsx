import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { Footer } from '../components/Footer';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'info@voice2law.pk',
      description: 'Send us an email anytime',
      color: 'from-[#1FAA59] to-[#0B3D2E]'
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+92 (300) 1234567',
      description: 'Mon-Fri from 9am to 6pm',
      color: 'from-[#C5A253] to-[#D4B76E]'
    },
    {
      icon: MapPin,
      title: 'Office',
      value: 'Islamabad, Pakistan',
      description: 'Visit our headquarters',
      color: 'from-[#1FAA59] to-[#0B3D2E]'
    }
  ];

  const faqs = [
    {
      question: 'Is Voice2Law free to use?',
      questionUrdu: 'کیا Voice2Law استعمال کرنا مفت ہے؟',
      answer: 'Yes, Voice2Law is completely free for all users. Our mission is to make legal information accessible to everyone.'
    },
    {
      question: 'Can I get legal advice from Voice2Law?',
      questionUrdu: 'کیا میں Voice2Law سے قانونی مشورہ حاصل کر سکتا ہوں؟',
      answer: 'Voice2Law provides legal information, not legal advice. For specific legal matters, please consult a qualified lawyer.'
    },
    {
      question: 'Which languages are supported?',
      questionUrdu: 'کون سی زبانیں معاون ہیں؟',
      answer: 'Currently, Voice2Law supports Urdu and English. We plan to add more regional languages in the future.'
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAA59]/10 rounded-full mb-6">
              <MessageSquare className="w-5 h-5 text-[#1FAA59]" />
              <span className="text-[#0B3D2E]">Get in Touch</span>
            </div>
            <h1 className="text-5xl md:text-6xl text-[#0B3D2E] mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-[#0B3D2E]/70 mb-4 urdu-text">
              ہم سے رابطہ کریں
            </p>
            <p className="text-lg text-[#0B3D2E]/60 max-w-3xl mx-auto">
              Have questions, feedback, or need support? We're here to help. Reach out to us through any of the following channels.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 text-center">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl text-[#0B3D2E] mb-2">{info.title}</h3>
                    <p className="text-[#0B3D2E] mb-2">{info.value}</p>
                    <p className="text-sm text-[#0B3D2E]/60">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Form & Info */}
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto mb-16">
            {/* Contact Form */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="bg-white rounded-3xl p-8 shadow-xl">
                <h2 className="text-3xl text-[#0B3D2E] mb-6">Send us a Message</h2>
                <p className="text-[#0B3D2E]/70 mb-6 urdu-text">ہمیں پیغام بھیجیں</p>
                
                {isSubmitted ? (
                  <div className="text-center py-12 animate-fade-in">
                    <CheckCircle className="w-20 h-20 text-[#1FAA59] mx-auto mb-4" />
                    <h3 className="text-2xl text-[#0B3D2E] mb-2">Message Sent!</h3>
                    <p className="text-[#0B3D2E]/60">Thank you for contacting us. We'll get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[#0B3D2E] mb-2">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0B3D2E] mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0B3D2E] mb-2">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0B3D2E] mb-2">Subject</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="feedback">Feedback</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#0B3D2E] mb-2">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all resize-none"
                        placeholder="Type your message here..."
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-4 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Additional Info & FAQs */}
            <div className="space-y-6">
              {/* Office Hours */}
              <div className="bg-white rounded-2xl p-8 shadow-lg animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-8 h-8 text-[#1FAA59]" />
                  <h3 className="text-2xl text-[#0B3D2E]">Office Hours</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#0B3D2E]/70">Monday - Friday</span>
                    <span className="text-[#0B3D2E]">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0B3D2E]/70">Saturday</span>
                    <span className="text-[#0B3D2E]">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0B3D2E]/70">Sunday</span>
                    <span className="text-[#0B3D2E]">Closed</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-[#0B3D2E]/10">
                  <p className="text-sm text-[#0B3D2E]/60">
                    <strong>Note:</strong> Voice2Law AI Assistant is available 24/7 for instant legal information.
                  </p>
                </div>
              </div>

              {/* Quick FAQs */}
              <div className="bg-white rounded-2xl p-8 shadow-lg animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <h3 className="text-2xl text-[#0B3D2E] mb-6">Quick FAQs</h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="pb-4 border-b border-[#0B3D2E]/10 last:border-0">
                      <h4 className="text-[#0B3D2E] mb-1">{faq.question}</h4>
                      <p className="text-sm text-[#0B3D2E]/70 urdu-text mb-2">{faq.questionUrdu}</p>
                      <p className="text-sm text-[#0B3D2E]/60">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Social & Support */}
          <div className="bg-gradient-to-r from-[#0B3D2E] to-[#1FAA59] rounded-3xl p-12 text-center text-white max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-3xl mb-4">Need Immediate Help?</h2>
            <p className="text-white/80 mb-6 urdu-text text-xl">فوری مدد چاہیے؟</p>
            <p className="text-white/90 mb-8">
              Our AI assistant is available 24/7 to answer your legal questions instantly.
            </p>
            <button className="px-8 py-4 bg-white text-[#0B3D2E] rounded-xl hover:bg-[#F8F9FA] transition-all duration-300 hover:scale-105">
              Ask Voice2Law Now
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
