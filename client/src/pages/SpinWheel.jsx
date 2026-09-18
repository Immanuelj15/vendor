import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { updateCoinBalance, updateSuperCoins, fetchCurrentUser } from '../store/authSlice';
import { Coins, Award, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

export const SpinWheel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [wheelData, setWheelData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wonReward, setWonReward] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const controls = useAnimation();

  useEffect(() => {
    fetchWheelConfig();
  }, []);

  const fetchWheelConfig = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/spin/wheel');
      setWheelData(res.data.data.wheel);
      setEligibility(res.data.data.eligibility);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.message || 'Failed to load Spin Wheel configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (spinning || !eligibility?.eligible) return;
    setSpinning(true);
    setWonReward(null);
    setErrorMsg('');

    try {
      const idempotencyKey = `spin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await api.post('/spin/spin', { idempotencyKey });
      const { winningSegmentIndex, reward, newCoinBalance, newSuperCoinBalance } = res.data.data;

      const rewardsCount = wheelData.rewards.length;
      const segmentAngle = 360 / rewardsCount;
      const targetAngle = 360 * 5 + (360 - winningSegmentIndex * segmentAngle - segmentAngle / 2);

      await controls.start({
        rotate: targetAngle,
        transition: { duration: 4, ease: [0.15, 0.9, 0.2, 1] },
      });

      setWonReward(reward);
      setEligibility((prev) => ({
        ...prev,
        eligible: (prev?.spinsRemaining || 1) > 1,
        spinsRemaining: Math.max(0, (prev?.spinsRemaining || 1) - 1),
      }));

      if (newCoinBalance !== undefined) {
        dispatch(updateCoinBalance(newCoinBalance));
      }
      if (newSuperCoinBalance !== undefined) {
        dispatch(updateSuperCoins(newSuperCoinBalance));
      }
      if (newCoinBalance === undefined && newSuperCoinBalance === undefined) {
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Spin request failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSpinning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const rewards = wheelData?.rewards || [];
  const cost = wheelData?.coinsRequiredPerSpin || 0;
  const spinsLeft = eligibility?.spinsRemaining ?? 0;
  const isEligible = eligibility?.eligible ?? false;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-center">
      {/* Header Info */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>FairKart Daily Lucky Spin</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {wheelData?.title || 'Daily Spin & Win'}
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          {wheelData?.description || 'Spin the wheel daily to earn exciting Fair Coins, Super Coins, and shopping rewards!'}
        </p>
      </div>

      {/* User Balance & Eligibility Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Fair Coins</div>
          <div className="text-base font-black text-amber-600 flex items-center justify-center gap-1 mt-0.5">
            <Coins className="w-4 h-4" />
            {Number(user?.fairCoinBalance ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Super Coins</div>
          <div className="text-base font-black text-blue-600 flex items-center justify-center gap-1 mt-0.5">
            <Award className="w-4 h-4" />
            {Number(user?.superCoinBalance ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Cost per Spin</div>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {cost === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `${cost} FC`}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Spins Remaining</div>
          <div className={`text-base font-black mt-0.5 ${spinsLeft > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {spinsLeft}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-md mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2 text-left">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wheel Animation Canvas */}
      <div className="relative w-80 h-80 mx-auto flex items-center justify-center py-4">
        {/* Pointer Triangle */}
        <div className="absolute -top-1 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500 filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)]" />

        {/* Animated Wheel */}
        <motion.div
          animate={controls}
          className="w-full h-full rounded-full border-4 border-amber-400 shadow-xl relative overflow-hidden bg-white"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {rewards.map((reward, i) => {
              const count = rewards.length;
              const angle = 360 / count;
              const startAngle = i * angle;
              const endAngle = (i + 1) * angle;

              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={i}
                  d={pathData}
                  fill={reward.color || (i % 2 === 0 ? '#2563eb' : '#3b82f6')}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
              );
            })}
          </svg>

          {/* Labels Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {rewards.map((reward, i) => {
              const angle = (360 / rewards.length) * i + (360 / rewards.length) / 2;
              return (
                <div
                  key={i}
                  className="absolute w-full text-center text-[10px] font-black text-white uppercase tracking-wider drop-shadow-sm"
                  style={{
                    transform: `rotate(${angle}deg) translate(92px) rotate(90deg)`,
                  }}
                >
                  {reward.title}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Center Spin Button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !isEligible}
          className="absolute z-20 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 hover:scale-105 active:scale-95 text-slate-950 font-black text-base shadow-xl flex flex-col items-center justify-center border-4 border-white transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
        >
          {spinning ? (
            <Loader2 className="w-7 h-7 animate-spin text-slate-950" />
          ) : (
            <>
              <span>SPIN</span>
              {cost > 0 && <span className="text-[10px] font-bold text-slate-900">{cost} FC</span>}
            </>
          )}
        </button>
      </div>

      {/* Won Reward Banner */}
      {wonReward && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-200 p-4 rounded-2xl max-w-md mx-auto flex items-center justify-center gap-3 text-amber-900 font-bold text-sm shadow-sm"
        >
          <Award className="w-7 h-7 text-amber-500 animate-bounce" />
          <div>
            <div className="font-black text-base">{wonReward.type === 'TRY_AGAIN' ? 'Better luck next time!' : '🎉 Congratulations!'}</div>
            <div className="text-xs font-semibold text-amber-800">
              {wonReward.type === 'TRY_AGAIN' ? 'Keep spinning daily for awesome rewards!' : `You won ${wonReward.title}!`}
            </div>
          </div>
        </motion.div>
      )}

      {/* Eligibility status text */}
      <div className="text-xs">
        {isEligible ? (
          <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {spinsLeft} spin{spinsLeft > 1 ? 's' : ''} available today!
          </span>
        ) : (
          <span className="text-slate-500 inline-flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            Daily spin limit reached. Come back tomorrow for new spins!
          </span>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
