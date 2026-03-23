export const splitEqually = (amount, count) => {
  if (count <= 0) return [];
  const base = Math.floor((amount * 100) / count) / 100;
  const remainder = Math.round((amount - base * count) * 100) / 100;
  const splits = Array(count).fill(base);
  if (remainder > 0) splits[0] = Math.round((splits[0] + remainder) * 100) / 100;
  return splits;
};

export const validateSplits = (splits, total) => {
  const sum = splits.reduce((a, b) => a + b, 0);
  return Math.abs(sum - total) < 0.01;
};
