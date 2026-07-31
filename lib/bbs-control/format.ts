export function money(value: number) {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

export function dateForInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function addDaysForInput(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return dateForInput(date);
}

export function displayDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}


