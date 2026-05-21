export const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return '';
  const date = parseDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString();
};

export const parseDate = (dateString: string | undefined | null) => {
  if (!dateString) return null;
  // Handle YYYY-MM-DD HH:MM:SS by taking only the date part
  const datePart = dateString.split(' ')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};
