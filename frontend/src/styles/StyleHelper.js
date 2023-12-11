const StyleHelper = (() => {
  const getBorderColor = (theme, i) => {
    const index = i + 1;
    const lowerBound = 1;
    const upperBound = 4;
    const rangeSize = upperBound - lowerBound + 1;
    const wrappedIndex = (index - lowerBound) % rangeSize;
    const result = wrappedIndex >= 0 ? wrappedIndex : rangeSize + wrappedIndex;
    const val = result + lowerBound;
    if (val == 1) return theme.palette.primary;
    if (val == 2) return theme.palette.secondary;
    if (val == 3) return theme.palette.third;
    if (val == 4) return theme.palette.fourth;
  };

  return { getBorderColor };
})();

export default StyleHelper;
