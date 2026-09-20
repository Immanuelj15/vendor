import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../store/authSlice';
import {
  ShoppingBag,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Share2,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Store,
  ShieldCheck,
  Gift,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthLayout } from '../components/auth/AuthLayout';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    shopQrToken: '',
    addressLine: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    latitude: null,
    longitude: null,
  });

  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData((prev) => ({ ...prev, referralCode: ref.toUpperCase() }));
    }

    const qrToken = searchParams.get('shopQrToken');
    if (qrToken) {
      setFormData((prev) => ({ ...prev, shopQrToken: qrToken }));
    }

    if (isAuthenticated) {
      navigate('/customer/dashboard');
    }
  }, [searchParams, isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported by your browser.');
      return;
    }
    setGeoStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationConsent(true);
        setGeoStatus('GPS location detected successfully (Optional)');
      },
      () => {
        setGeoStatus('Permission denied or unavailable. You can enter your address manually.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const payload = {
      name: fullName || formData.firstName.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      referralCode: formData.referralCode.trim() || undefined,
      shopQrToken: formData.shopQrToken || undefined,
    };

    if (formData.addressLine || formData.city || formData.pincode) {
      payload.address = {
        addressLine1: formData.addressLine.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || 'India',
        postalCode: formData.pincode.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
      };
    }

    const result = await dispatch(registerUser(payload));
    if (!result.error) {
      navigate('/customer/dashboard');
    }
  };

  return (
    <AuthLayout
      badge="Join FairKart Network"
      title="Create Your Account & Claim Welcome Coins"
      subtitle="Sign up in seconds to unlock member-only flash discounts, earn Fair Coins with every spin wheel, and build your referral upline."
      imageSrc="/images/customer-auth.jpg"
      imageAlt="FairKart Registration"
      features={[
        { icon: Coins, text: 'Instant 100 Welcome Fair Coins credited to wallet' },
        { icon: Gift, text: 'Free daily spin on the FairKart Reward Wheel' },
        { icon: ShieldCheck, text: 'Safe, private, and verified customer protections' },
      ]}
      theme="blue"
    >
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 mb-3 shadow-xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100/70 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2">
            Customer Registration
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Customer Account</h2>
          <p className="text-xs text-slate-500 mt-1">Start shopping, earning Fair Coins, and unlocking VIP perks</p>
        </div>

        {(error || validationError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError || error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@example.com"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 chars"
                  className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Referral Code (Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="e.g. FAIRKART"
                className="w-full bg-slate-50 text-xs text-blue-900 placeholder-slate-400 rounded-xl px-4 py-2.5 pl-10 border border-blue-200 focus:outline-none focus:border-blue-500 focus:bg-white uppercase font-mono transition-colors"
              />
              <Share2 className="w-4 h-4 text-blue-500 absolute left-3.5 top-3" />
            </div>
            {formData.referralCode && (
              <p className="text-[11px] text-blue-700 font-medium mt-1">
                ✓ Referred by partner code: <strong>{formData.referralCode}</strong>
              </p>
            )}
          </div>

          {/* Optional Delivery Address Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAddressFields(!showAddressFields)}
              className="flex items-center justify-between w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Add Delivery Address (Optional)</span>
              </span>
              {showAddressFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showAddressFields && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-3 overflow-hidden"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Address Line</label>
                    <input
                      type="text"
                      name="addressLine"
                      value={formData.addressLine}
                      onChange={handleChange}
                      placeholder="House/Flat No., Street, Landmark"
                      className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="600001"
                        className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="India"
                        className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Optional GPS Location Request with Consent */}
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 font-medium">Auto-fill via Device GPS (Optional):</span>
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors"
                      >
                        {locationConsent ? 'GPS Detected ✓' : 'Use Current Location'}
                      </button>
                    </div>
                    {geoStatus && (
                      <p className="text-[10px] text-slate-500 italic">{geoStatus}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Create Customer Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-bold">
              Sign In
            </Link>
          </p>

          <div className="pt-2">
            <Link
              to="/vendor/register"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-semibold transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Want to sell on FairKart? Apply as a Vendor</span>
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
