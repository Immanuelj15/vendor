import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  User,
  Briefcase,
  MapPin,
  FileCheck,
  Landmark,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const InputField = ({ label, name, type = 'text', required = false, formData, onChange, children, disabled, errors, error, ...props }) => {
  const fieldError = error || errors?.[name];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {fieldError && (
          <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {fieldError}
          </span>
        )}
      </div>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={formData[name]}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full bg-slate-50 border ${
            fieldError ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
          } text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all h-24 resize-none font-medium disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed`}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={formData[name]}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full bg-slate-50 border ${
            fieldError ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
          } text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all font-medium disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed`}
          {...props}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full bg-slate-50 border ${
            fieldError ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
          } text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all font-medium disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed`}
          {...props}
        />
      )}
    </div>
  );
};

export const VendorOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState(null); // PENDING, UNDER_REVIEW, REJECTED
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    storeName: '',
    description: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    state: '',
    district: '',
    talukArea: '',
    pincode: '',
    fullAddress: '',
    identityDocumentType: '',
    identityDocumentNumber: '',
    identityDocumentUpload: '',
    panDocumentUpload: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    termsAccepted: false,
  });

  const [statesList, setStatesList] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allTaluks, setAllTaluks] = useState([]);
  const [loadingTerritories, setLoadingTerritories] = useState(true);

  const [errors, setErrors] = useState({});
  const [stepWarning, setStepWarning] = useState('');

  const clearFieldError = (fieldName) => {
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setStepWarning('');
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('fk_access_token');
    if (token) {
      api.get('/auth/vendor-onboarding/status')
        .then((res) => {
          if (res.data?.data?.vendor) {
            setStatus(res.data.data.vendor.status);
            if (res.data.data.vendor.status === 'UNDER_REVIEW') setCurrentStep(7);
          }
        })
        .catch(() => {});
    }

    setLoadingTerritories(true);
    Promise.all([
      api.get('/territories/states'),
      api.get('/territories/districts'),
      api.get('/territories/taluks'),
    ])
      .then(([statesRes, districtsRes, taluksRes]) => {
        setStatesList(statesRes.data?.data?.states || []);
        setAllDistricts(districtsRes.data?.data?.districts || []);
        setAllTaluks(taluksRes.data?.data?.taluks || []);
      })
      .catch((err) => {
        console.error('Failed to load territories:', err);
      })
      .finally(() => {
        setLoadingTerritories(false);
      });
  }, []);

  // Filtered lists based on selection
  const availableDistricts = formData.state
    ? allDistricts.filter((d) => String(d.parentTerritory) === String(formData.state))
    : allDistricts;

  const availableTaluks = formData.district
    ? allTaluks.filter((t) => String(t.parentTerritory) === String(formData.district))
    : formData.state
    ? allTaluks.filter((t) => {
        const parentDistrict = allDistricts.find((d) => String(d._id) === String(t.parentTerritory));
        return parentDistrict && String(parentDistrict.parentTerritory) === String(formData.state);
      })
    : allTaluks;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    clearFieldError(name);

    if (name === 'state') {
      const currentDistrict = allDistricts.find((d) => String(d._id) === String(formData.district));
      const districtBelongs = currentDistrict && String(currentDistrict.parentTerritory) === String(value);

      setFormData((prev) => ({
        ...prev,
        state: value,
        district: districtBelongs ? prev.district : '',
        talukArea: districtBelongs ? prev.talukArea : '',
        pincode: districtBelongs ? prev.pincode : '',
      }));
      return;
    }

    if (name === 'district') {
      const selectedDistrict = allDistricts.find((d) => String(d._id) === String(value));
      const currentTaluk = allTaluks.find((t) => String(t._id) === String(formData.talukArea));
      const talukBelongs = currentTaluk && String(currentTaluk.parentTerritory) === String(value);

      setFormData((prev) => ({
        ...prev,
        state: selectedDistrict?.parentTerritory || prev.state,
        district: value,
        talukArea: talukBelongs ? prev.talukArea : '',
        pincode: talukBelongs ? prev.pincode : '',
      }));
      return;
    }

    if (name === 'talukArea') {
      const selectedTaluk = allTaluks.find((t) => String(t._id) === String(value));
      if (selectedTaluk) {
        const parentDistrict = allDistricts.find((d) => String(d._id) === String(selectedTaluk.parentTerritory));
        const autoPincode = selectedTaluk.pincodes?.[0] || '';

        setFormData((prev) => ({
          ...prev,
          talukArea: value,
          district: selectedTaluk.parentTerritory || prev.district,
          state: parentDistrict?.parentTerritory || prev.state,
          pincode: autoPincode || prev.pincode,
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        talukArea: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [field]: reader.result,
      }));
      clearFieldError(field);
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step) => {
    const errs = {};

    if (step === 1) {
      if (!formData.name?.trim()) errs.name = 'Full legal name is required';
      if (!formData.email?.trim()) {
        errs.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = 'Please enter a valid email address';
      }
      if (!formData.phone?.trim()) {
        errs.phone = 'Mobile number is required';
      } else if (!/^\d{10}$/.test(formData.phone.trim().replace(/\D/g, ''))) {
        errs.phone = 'Valid 10-digit mobile number required';
      }
      if (!formData.password) {
        errs.password = 'Account password is required';
      } else if (formData.password.length < 6) {
        errs.password = 'Password must be at least 6 characters';
      }
    }

    if (step === 2) {
      if (!formData.storeName?.trim()) errs.storeName = 'Store name is required';
    }

    if (step === 3) {
      if (!formData.state) errs.state = 'Please select a State';
      if (!formData.district) errs.district = 'Please select a District';
      if (!formData.talukArea) errs.talukArea = 'Please select a Taluk / Area';
      if (!formData.pincode?.trim()) {
        errs.pincode = 'PIN code is required';
      } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
        errs.pincode = 'Valid 6-digit PIN code required';
      }
      if (!formData.fullAddress?.trim()) errs.fullAddress = 'Full street address is required';
    }

    if (step === 4) {
      if (!formData.identityDocumentType) errs.identityDocumentType = 'Select document type';
      if (!formData.identityDocumentNumber?.trim()) errs.identityDocumentNumber = 'Document ID number is required';
      if (!formData.identityDocumentUpload) errs.identityDocumentUpload = 'Identity document (PDF) upload is required';
    }

    if (step === 5) {
      if (!formData.accountHolderName?.trim()) errs.accountHolderName = 'Account holder name is required';
      if (!formData.bankName?.trim()) errs.bankName = 'Bank name is required';
      if (!formData.accountNumber?.trim()) errs.accountNumber = 'Account number is required';
      if (!formData.ifscCode?.trim()) {
        errs.ifscCode = 'IFSC code is required';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode.trim())) {
        errs.ifscCode = 'Valid IFSC code required (e.g. HDFC0001234)';
      }
    }

    return errs;
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setStepWarning('Please fill all mandatory fields correctly before moving to the next step.');
      return;
    }
    setErrors({});
    setStepWarning('');
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setErrors({});
    setStepWarning('');
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let step = 1; step <= 5; step++) {
      const stepErrors = validateStep(step);
      if (Object.keys(stepErrors).length > 0) {
        setCurrentStep(step);
        setErrors(stepErrors);
        setStepWarning(`Please complete all mandatory fields in Step ${step} before submitting.`);
        return;
      }
    }
    if (!formData.termsAccepted) {
      setStepWarning('You must accept the terms and conditions to submit.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/vendor-onboarding/register', formData);
      if (response.status === 200 || response.status === 201) {
        setStatus('UNDER_REVIEW');
        setCurrentStep(7);
      } else {
        alert('Error: ' + (response.data?.message || 'Registration failed'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your inputs and try again.';
      alert('Error: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Business', icon: Briefcase },
    { id: 3, title: 'Location', icon: MapPin },
    { id: 4, title: 'KYC', icon: FileCheck },
    { id: 5, title: 'Banking', icon: Landmark },
    { id: 6, title: 'Submit', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Become a FairKart Merchant</h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Sell to thousands of active customers with zero registration fees and automated 7-day payouts.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden"
        >
          {/* Stepper Header */}
          {currentStep <= 6 && (
            <div className="border-b border-slate-100 bg-slate-50/70 p-6 hidden sm:block">
              <div className="flex justify-between items-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 -z-10 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                />

                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                          isActive
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100'
                            : isCompleted
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span
                        className={`text-[11px] uppercase tracking-wider font-bold ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-10">
            {status === 'UNDER_REVIEW' ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border border-amber-200 mb-2">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Application Under Review</h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                  Your vendor application has been successfully submitted and is currently being verified by our onboarding
                  team. You will receive an SMS and email notification upon approval.
                </p>
              </div>
            ) : status === 'REJECTED' ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 border border-rose-200 mb-2">
                  <AlertCircle className="w-10 h-10 text-rose-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Application Needs Attention</h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-4 leading-relaxed">
                  Your application was reviewed and requires minor corrections. Please update the necessary documents and
                  resubmit for prompt approval.
                </p>
                <button
                  onClick={() => setStatus('PENDING')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  Edit & Resubmit Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Step 1 */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Tell us about yourself, the legal account owner.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Full Legal Name"
                        name="name"
                        required
                        placeholder="John Doe"
                      />
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Email Address"
                        name="email"
                        type="email"
                        required
                        placeholder="merchant@example.com"
                      />
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Mobile Number"
                        name="phone"
                        required
                        placeholder="9876543210"
                      />
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Account Password"
                        name="password"
                        type="password"
                        required
                        placeholder="Create a strong password"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Business Information</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Details regarding your storefront and business entity.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Store Name"
                        name="storeName"
                        required
                        placeholder="Royal Fashion Mart"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                          formData={formData}
                          onChange={handleChange}
                          errors={errors}
                          label="Business Type"
                          name="businessType"
                          placeholder="e.g. Retail, Wholesale, Manufacturing"
                        />
                        <InputField
                          formData={formData}
                          onChange={handleChange}
                          errors={errors}
                          label="GST Number"
                          name="gstNumber"
                          placeholder="Optional for unregistered vendors"
                        />
                      </div>
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="PAN Number (Business / Personal)"
                        name="panNumber"
                        placeholder="ABCDE1234F"
                      />
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Store Description"
                        name="description"
                        type="textarea"
                        placeholder="Describe the products you offer and your specialties..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Location & Dispatch Territory</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Where is your inventory stored and dispatched from?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="State"
                        name="state"
                        type="select"
                        required
                      >
                        <option value="">
                          {loadingTerritories ? 'Loading States...' : 'Select State'}
                        </option>
                        {statesList.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </InputField>
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="District"
                        name="district"
                        type="select"
                        required
                      >
                        <option value="">
                          {loadingTerritories ? 'Loading Districts...' : 'Select District'}
                        </option>
                        {availableDistricts.map((d) => (
                          <option key={d._id} value={d._id}>
                            {formData.state ? d.name : `${d.name} (${d.state || ''})`}
                          </option>
                        ))}
                      </InputField>
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Taluk / Area"
                        name="talukArea"
                        type="select"
                        required
                      >
                        <option value="">
                          {loadingTerritories ? 'Loading Taluks / Areas...' : 'Select Taluk / Area'}
                        </option>
                        {availableTaluks.map((t) => (
                          <option key={t._id} value={t._id}>
                            {formData.district ? t.name : `${t.name} (${t.district || ''})`}
                          </option>
                        ))}
                      </InputField>
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="PIN Code"
                        name="pincode"
                        required
                        placeholder="e.g. 560001"
                      />
                    </div>
                    <InputField
                      formData={formData}
                      onChange={handleChange}
                      errors={errors}
                      label="Full Street Address"
                      name="fullAddress"
                      type="textarea"
                      required
                      placeholder="Building name, street, landmarks..."
                    />
                  </div>
                )}

                {/* Step 4 */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">KYC Verification</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Upload required documents to verify your business identity.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Document Type"
                        name="identityDocumentType"
                        type="select"
                        required
                      >
                        <option value="">Select Document</option>
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="VOTER_ID">Voter ID</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVING_LICENSE">Driving License</option>
                      </InputField>
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Document Number"
                        name="identityDocumentNumber"
                        required
                        placeholder="Document ID number"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Identity Document Upload (PDF) <span className="text-rose-500">*</span>
                          </label>
                          {errors.identityDocumentUpload && (
                            <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 animate-fadeIn">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {errors.identityDocumentUpload}
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-4 bg-slate-50 border ${
                            errors.identityDocumentUpload
                              ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-100'
                              : 'border-slate-200'
                          } rounded-xl p-3 transition-all`}
                        >
                          <input
                            type="file"
                            accept="application/pdf"
                            required
                            onChange={(e) => handleFileUpload(e, 'identityDocumentUpload')}
                            className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer focus:outline-none"
                          />
                          {formData.identityDocumentUpload && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">PAN Document Upload (PDF)</label>
                        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleFileUpload(e, 'panDocumentUpload')}
                            className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer focus:outline-none"
                          />
                          {formData.panDocumentUpload && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5 */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Bank Account Details</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Where should we remit your weekly 7-day settlements?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Account Holder Name"
                        name="accountHolderName"
                        required
                        placeholder="Legal name on bank account"
                      />
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Bank Name"
                        name="bankName"
                        required
                        placeholder="e.g. HDFC Bank, ICICI, SBI"
                      />
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="Account Number"
                        name="accountNumber"
                        required
                        placeholder="Bank account number"
                      />
                      <InputField
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        label="IFSC Code"
                        name="ifscCode"
                        required
                        placeholder="e.g. HDFC0001234"
                      />
                    </div>
                  </div>
                )}

                {/* Step 6 */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Review & Confirmation</h2>
                      <p className="text-sm text-slate-600 mt-0.5">Confirm your business details and accept partner terms.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-sm text-slate-700 space-y-2.5">
                      <p>
                        <strong className="text-slate-900 font-bold">Store Name:</strong> {formData.storeName}
                      </p>
                      <p>
                        <strong className="text-slate-900 font-bold">Email:</strong> {formData.email}
                      </p>
                      <p>
                        <strong className="text-slate-900 font-bold">Phone:</strong> {formData.phone}
                      </p>
                      <p>
                        <strong className="text-slate-900 font-bold">Settlement Bank:</strong> {formData.bankName} (
                        {formData.accountNumber})
                      </p>
                    </div>

                    <label className="flex items-start space-x-3 p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleChange}
                        required
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        I hereby declare that all details furnished above are accurate and valid. I agree to the FairKart{' '}
                        <a href="#" className="text-blue-600 font-bold hover:underline">
                          Merchant Agreement
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-blue-600 font-bold hover:underline">
                          Platform Policies
                        </a>
                        .
                      </span>
                    </label>
                  </div>
                )}

                {/* Warning Banner if mandatory fields missing */}
                {stepWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-rose-900">Mandatory Fields Required</p>
                      <p className="text-xs text-rose-700 font-medium mt-0.5">{stepWarning}</p>
                    </div>
                  </motion.div>
                )}

                {/* Footer Navigation */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all flex items-center gap-2 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 6 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-7 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 text-sm"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!formData.termsAccepted || isSubmitting}
                      className="px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Merchant Application</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorOnboarding;
