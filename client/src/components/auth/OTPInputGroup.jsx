import { useEffect, useRef } from 'react';

const normalizeDigits = (digits, length) => (
  Array.from({ length }, (_, index) => {
    const value = digits?.[index];
    return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 1) : '';
  })
);

export default function OTPInputGroup({
  digits,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  onComplete,
  shake = false
}) {
  const inputRefs = useRef([]);
  const safeDigits = normalizeDigits(digits, length);

  useEffect(() => {
    if (autoFocus && safeDigits.every((digit) => !digit)) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, safeDigits]);

  const commitDigits = (nextDigits, shouldTriggerComplete = true) => {
    const normalized = normalizeDigits(nextDigits, length);
    onChange(normalized);

    if (shouldTriggerComplete && normalized.every(Boolean)) {
      onComplete?.(normalized.join(''));
    }
  };

  const handleChange = (index, rawValue) => {
    const cleanedValue = rawValue.replace(/\D/g, '');
    const nextDigits = [...safeDigits];

    if (!cleanedValue) {
      nextDigits[index] = '';
      commitDigits(nextDigits, false);
      return;
    }

    cleanedValue
      .slice(0, length - index)
      .split('')
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });

    commitDigits(nextDigits);

    if (cleanedValue.length === 1 && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      return;
    }

    const lastIndex = Math.min(index + cleanedValue.length - 1, length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();

      const nextDigits = [...safeDigits];
      if (nextDigits[index]) {
        nextDigits[index] = '';
        commitDigits(nextDigits, false);
        return;
      }

      if (index > 0) {
        nextDigits[index - 1] = '';
        commitDigits(nextDigits, false);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index, event) => {
    event.preventDefault();

    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pastedDigits) return;

    const nextDigits = [...safeDigits];
    pastedDigits
      .slice(0, length - index)
      .split('')
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });

    commitDigits(nextDigits);

    const lastIndex = Math.min(index + pastedDigits.length - 1, length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
      {safeDigits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className="input-dark"
          style={{
            width: '48px',
            height: '48px',
            padding: 0,
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 700,
            borderRadius: '12px',
            animation: shake ? 'otpShake 0.35s ease-in-out' : undefined
          }}
        />
      ))}
    </div>
  );
}
