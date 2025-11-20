import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  checks: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export default function PasswordStrengthMeter({
  password,
  className = '',
}: PasswordStrengthMeterProps) {
  const strength: StrengthResult = useMemo(() => {
    const checks = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;

    if (password.length === 0) {
      return {
        score: 0,
        label: '',
        color: '',
        bgColor: '',
        checks,
      };
    }

    if (passedChecks <= 2 || password.length < 6) {
      return {
        score: 1,
        label: 'Weak',
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        checks,
      };
    }

    if (passedChecks === 3 || password.length < 8) {
      return {
        score: 2,
        label: 'Fair',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500',
        checks,
      };
    }

    if (passedChecks === 4) {
      return {
        score: 3,
        label: 'Good',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        checks,
      };
    }

    return {
      score: 4,
      label: 'Strong',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      checks,
    };
  }, [password]);

  if (password.length === 0) {
    return null;
  }

  const requirements = [
    { label: 'At least 8 characters', met: strength.checks.minLength },
    { label: 'One uppercase letter', met: strength.checks.hasUpperCase },
    { label: 'One lowercase letter', met: strength.checks.hasLowerCase },
    { label: 'One number', met: strength.checks.hasNumber },
    { label: 'One special character', met: strength.checks.hasSpecial },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength bars */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <motion.div
            key={level}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: level * 0.05 }}
            className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: strength.score >= level ? '100%' : '0%',
              }}
              transition={{ duration: 0.3 }}
              className={`h-full ${
                strength.score >= level ? strength.bgColor : 'bg-gray-200'
              }`}
            />
          </motion.div>
        ))}
      </div>

      {/* Strength label */}
      {strength.label && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-medium ${strength.color}`}
        >
          Password strength: {strength.label}
        </motion.p>
      )}

      {/* Requirements checklist */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="space-y-1.5"
      >
        {requirements.map((req, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center space-x-2 text-xs"
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <X className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span className={req.met ? 'text-gray-700' : 'text-gray-500'}>
              {req.label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
