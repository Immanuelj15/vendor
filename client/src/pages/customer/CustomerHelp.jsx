import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HelpCircle,
  Headphones,
  Search,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Shield,
  Clock,
  Send,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Package,
  RotateCcw,
  Coins,
  Crown,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_CATEGORIES = [
  { id: 'all', name: 'All Questions', icon: HelpCircle },
  { id: 'orders', name: 'Orders & Shipping', icon: Package },
  { id: 'returns', name: 'Returns & Refunds', icon: RotateCcw },
  { id: 'rewards', name: 'Fair Coins & Spin', icon: Coins },
  { id: 'vip', name: 'VIP Membership', icon: Crown },
  { id: 'account', name: 'Account & Security', icon: Shield },
];

const FAQS = [
  {
    id: 1,
    category: 'orders',
    question: 'How do I track my order in real-time?',
    answer:
      'You can track your order at any moment by navigating to "Orders" -> "Track Orders" in your sidebar. Each active shipment displays real-time milestone checkpoints (Confirmed, Processing, Dispatched, In Transit, and Out for Delivery).',
    link: '/customer/orders?tab=tracking',
    linkText: 'Go to Track Orders',
  },
  {
    id: 2,
    category: 'orders',
    question: 'What should I do if my shipment delivery is delayed?',
    answer:
      'Orders are typically fulfilled by our verified vendors and regional delivery hubs within 2-4 business days. If your order passes the estimated delivery date, please use the Contact Support tab below or WhatsApp our support team with your Order # for immediate escalation.',
  },
  {
    id: 3,
    category: 'returns',
    question: 'What is the FairKart return and refund policy?',
    answer:
      'We offer an easy 7-day return policy for eligible products. To initiate a return, go to "Orders" -> select your delivered order -> click "Request Return". Once the vendor approves and the courier picks up the parcel, your refund is credited directly to your original payment method or Fair Coins wallet.',
    link: '/customer/orders?tab=returns',
    linkText: 'View Return Status',
  },
  {
    id: 4,
    category: 'returns',
    question: 'How long does it take to receive my refund?',
    answer:
      'UPI and wallet refunds are processed instantly once verified. Net banking and credit/debit card refunds typically reflect in your bank account within 3 to 5 business days depending on your issuing bank.',
  },
  {
    id: 5,
    category: 'rewards',
    question: 'How do I earn and redeem Fair Coins?',
    answer:
      'You earn Fair Coins on every marketplace order, offline partner bill submission, daily Spin & Win game, and referral bonuses. 1 Fair Coin equals ₹1.00 at checkout, which can be applied directly to reduce your final order payable amount.',
    link: '/customer/wallet',
    linkText: 'Check Coin Balance',
  },
  {
    id: 6,
    category: 'rewards',
    question: 'Do Fair Coins ever expire?',
    answer:
      'Promotional spin coins have a validity of 90 days from the date of issue. Coins earned through paid marketplace transactions and offline bill cashbacks do not expire as long as your account remains active.',
  },
  {
    id: 7,
    category: 'vip',
    question: 'What are the benefits of the FairKart VIP Pass?',
    answer:
      'VIP Pass holders enjoy 2X Fair Coin multipliers on every purchase, zero delivery fees on orders above ₹199, daily bonus spins on Spin & Win, priority fulfillment, and exclusive access to flash sale discounts.',
    link: '/customer/subscription',
    linkText: 'Explore VIP Benefits',
  },
  {
    id: 8,
    category: 'account',
    question: 'How do I update my registered mobile number or shipping address?',
    answer:
      'You can update your delivery addresses anytime in "Account" -> "Addresses". For phone and email changes, visit "Account" -> "My Profile". If you have an approved merchant/shopkeeper KYC verification, changes can be requested via our support desk.',
    link: '/customer/addresses',
    linkText: 'Manage Addresses',
  },
];

export const CustomerHelp = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'help';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(1);

  // Ticket Form States
  const [ticketForm, setTicketForm] = useState({
    category: 'ORDER_ISSUE',
    orderNumber: '',
    subject: '',
    message: '',
    priority: 'NORMAL',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    // If query tab changes to contact, reset submitted ticket
    if (currentTab !== 'contact') {
      setSubmittedTicket(null);
    }
  }, [currentTab]);

  const handleTabChange = (tab) => {
    if (tab === 'help') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: 'contact' });
    }
  };

  const handleTicketChange = (e) => {
    setTicketForm({ ...ticketForm, [e.target.name]: e.target.value });
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
      setSubmittedTicket({
        id: ticketId,
        subject: ticketForm.subject,
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      setTicketForm({
        category: 'ORDER_ISSUE',
        orderNumber: '',
        subject: '',
        message: '',
        priority: 'NORMAL',
      });
    }, 800);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchQuery =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-10 shadow-xl shadow-blue-600/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>24/7 Customer Care</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Search our knowledge base for instant answers or raise a support ticket with our concierge team.
          </p>

          {/* Search Box in Banner */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, returns, wallet coins, VIP pass, or refunds..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('help')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentTab !== 'contact'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help Center & FAQs</span>
          </button>

          <button
            onClick={() => handleTabChange('contact')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'contact'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Contact Support</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Support Desk Online</span>
        </div>
      </div>

      {/* TAB 1: HELP CENTER & FAQS */}
      {currentTab !== 'contact' ? (
        <div className="space-y-8">
          {/* Quick Category Selector */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Browse by Topic</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {FAQ_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Quick solutions to the most common inquiries</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {filteredFaqs.length} Answers
              </span>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No matching articles found</p>
                <p className="text-xs text-slate-500">Try searching with another keyword or connect with support directly.</p>
                <button
                  onClick={() => handleTabChange('contact')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Contact Support
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaq === faq.id;
                  return (
                    <div key={faq.id} className="py-4">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between gap-4 text-left group"
                      >
                        <span className={`text-xs sm:text-sm font-bold transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-800 group-hover:text-slate-900'}`}>
                          {faq.question}
                        </span>
                        <div className={`p-1.5 rounded-lg border transition-all ${isOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-3 pr-8 space-y-3"
                          >
                            <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                            {faq.link && (
                              <Link
                                to={faq.link}
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold transition"
                              >
                                <span>{faq.linkText || 'Learn More'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: CONTACT SUPPORT / SUBMIT TICKET */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Ticket Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Submit a Support Ticket</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Our support agents respond within 2 hours during active business hours.
              </p>
            </div>

            {submittedTicket ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4"
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Support Ticket Created Successfully!</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Your request reference code is{' '}
                    <span className="font-mono font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
                      {submittedTicket.id}
                    </span>
                  </p>
                </div>
                <div className="p-4 bg-white border border-emerald-100 rounded-2xl text-xs text-slate-600 max-w-md mx-auto text-left space-y-1">
                  <div><strong>Subject:</strong> {submittedTicket.subject}</div>
                  <div><strong>Logged At:</strong> {submittedTicket.createdAt}</div>
                  <div><strong>Status:</strong> <span className="text-blue-600 font-bold">Assigned to Agent</span></div>
                </div>
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-xs"
                >
                  Create Another Ticket
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Issue Category</label>
                    <select
                      name="category"
                      value={ticketForm.category}
                      onChange={handleTicketChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    >
                      <option value="ORDER_ISSUE">Order Tracking / Delayed Delivery</option>
                      <option value="RETURN_REFUND">Return / Refund Request</option>
                      <option value="PAYMENT_FAILURE">Payment Failure / Double Charge</option>
                      <option value="WALLET_COINS">Fair Coins / Spin & Win Dispute</option>
                      <option value="VIP_MEMBERSHIP">VIP Pass Subscription</option>
                      <option value="ACCOUNT_SECURITY">Account Login / Password / Security</option>
                      <option value="OTHER">Other Marketplace Query</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Order Reference # (Optional)</label>
                    <input
                      type="text"
                      name="orderNumber"
                      value={ticketForm.orderNumber}
                      onChange={handleTicketChange}
                      placeholder="e.g. FK-982412"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Subject Summary</label>
                  <input
                    type="text"
                    name="subject"
                    value={ticketForm.subject}
                    onChange={handleTicketChange}
                    required
                    placeholder="Brief description of the problem you are experiencing..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Detailed Message</label>
                  <textarea
                    rows={5}
                    name="message"
                    value={ticketForm.message}
                    onChange={handleTicketChange}
                    required
                    placeholder="Provide any helpful details, dates, transaction references, or product names..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Priority:</span>
                    <button
                      type="button"
                      onClick={() => setTicketForm({ ...ticketForm, priority: 'NORMAL' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        ticketForm.priority === 'NORMAL'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketForm({ ...ticketForm, priority: 'URGENT' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        ticketForm.priority === 'URGENT'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Urgent / Escalated
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting Ticket...' : 'Submit Support Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Direct Contact Details Cards */}
          <div className="space-y-4">
            {/* Phone Help */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Toll-Free Customer Care</h3>
                <p className="text-xs text-slate-500 mt-0.5">Direct phone assistance for order escalations</p>
              </div>
              <div className="text-sm font-black text-blue-600">1800-889-FAIR (3247)</div>
              <div className="text-[11px] text-slate-400">Available Mon - Sun: 8:00 AM - 10:00 PM IST</div>
            </div>

            {/* Email Support */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Email Inquiries</h3>
                <p className="text-xs text-slate-500 mt-0.5">Send documents, invoices, or screenshots</p>
              </div>
              <a
                href="mailto:support@fairkart.dev"
                className="text-xs font-bold text-blue-600 hover:underline block"
              >
                support@fairkart.dev
              </a>
              <div className="text-[11px] text-slate-400">Average response time: &lt; 2 hours</div>
            </div>

            {/* Security Guarantee */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>FairKart Buyer Protection</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All marketplace transactions are protected by FairKart escrow guarantee. Full refunds are honored for unfulfilled or damaged goods.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHelp;
