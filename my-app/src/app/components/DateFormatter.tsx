import React from 'react';

const DateFormatter = ({ timestamp }) => {
  if (!timestamp) return <span>Unknown</span>;

  timestamp=Number(timestamp)*1000;

  const date = new Date(timestamp);
  const formattedDate = date
    .toLocaleString('en-US', {
      timeZone:"UTC",
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', ''); // remove the comma between date and time

  return <span>{formattedDate}</span>;
};

export default DateFormatter;
