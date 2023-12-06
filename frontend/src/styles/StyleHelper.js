const StyleHelper = (() => {
  const getBorderColor = (theme, index) => {
    const i = index + 1;
    return i % 4 == 0
      ? theme.palette.fourth
      : i % 3 == 0
      ? theme.palette.third
      : i % 2 == 0
      ? theme.palette.secondary
      : theme.palette.primary;
  };

  return { getBorderColor };
})();

export default StyleHelper;
