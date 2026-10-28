const base = "https://data-api.binance.vision/api/v3/ticker/24hr";
const forms = [
  '?symbols=["BNBUSDT","BTCUSDT"]',
  "?symbols=" + encodeURIComponent('["BNBUSDT","BTCUSDT"]'),
  "?symbols=" + encodeURIComponent("[\"BNBUSDT\",\"BTCUSDT\"]").replaceAll("%2C", ","),
  "?symbols=['BNBUSDT','BTCUSDT']",
  "?symbols=BNBUSDT,BTCUSDT"
];
for (const form of forms) {
  try {
    const response = await fetch(base + form);
    const text = await response.text();
    console.log(response.status, form, "->", text.slice(0, 90).replace(/\s+/g, " "));
  } catch (error) {
    console.log("ERR", form, String(error.message).slice(0, 80));
  }
}
