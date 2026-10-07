export function getXetraStatus(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const getPart = (type) =>
    parts.find((part) => part.type === type)?.value;

  const weekday = getPart("weekday");
  const hour = Number(getPart("hour"));
  const minute = Number(getPart("minute"));

  const currentMinutes = hour * 60 + minute;

  const openMinutes = 9 * 60;
  const closeMinutes = 17 * 60 + 30;

  const isWeekday = !["Sat", "Sun"].includes(weekday);

  const isOpen =
    isWeekday &&
    currentMinutes >= openMinutes &&
    currentMinutes < closeMinutes;

  return {
    isOpen,
    status: isOpen ? "OPEN" : "CLOSED",
    localTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    weekday,
  };
}