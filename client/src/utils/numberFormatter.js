export const formatNumber = (
  value = 0
) => {

  const num =
    Number(value);

  if (num >= 1000000) {
    return `${(
      num / 1000000
    ).toFixed(1)} M`;
  }

  if (num >= 1000) {
    return `${(
      num / 1000
    ).toFixed(1)} K`;
  }

  return num.toFixed(1);
};