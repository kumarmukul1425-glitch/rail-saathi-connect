export interface Train {
  train_number: string;
  train_name: string;
  source_station: string;
  source_code: string;
  destination_station: string;
  destination_code: string;
  departure_time: string;
  arrival_time: string;
  journey_duration: string;
  train_type: string;
  classes: TrainClass[];
  intermediate_stops: string[];
  runs_on: string[];
}

export interface TrainClass {
  code: string;
  name: string;
  available_seats: number;
  price: number;
}

function makeClasses(base: number, type: string): TrainClass[] {
  const multiplier = type === "Rajdhani" ? 1.8 : type === "Shatabdi" ? 1.5 : type === "Duronto" ? 1.6 : type === "Superfast" ? 1.1 : 1;
  return [
    { code: "SL", name: "Sleeper", available_seats: Math.floor(Math.random() * 200 + 20), price: Math.round(base * multiplier) },
    { code: "3A", name: "Third AC", available_seats: Math.floor(Math.random() * 80 + 5), price: Math.round(base * 2.5 * multiplier) },
    { code: "2A", name: "Second AC", available_seats: Math.floor(Math.random() * 40 + 2), price: Math.round(base * 3.8 * multiplier) },
    { code: "1A", name: "First AC", available_seats: Math.floor(Math.random() * 15), price: Math.round(base * 5.5 * multiplier) },
  ];
}

const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface TrainTemplate {
  number: string;
  name: string;
  src: string;
  srcCode: string;
  dst: string;
  dstCode: string;
  dep: string;
  arr: string;
  dur: string;
  type: string;
  base: number;
  stops: string[];
}

const templates: TrainTemplate[] = [
  // Delhi - Mumbai
  { number: "12951", name: "Mumbai Rajdhani Express", src: "New Delhi", srcCode: "NDLS", dst: "Mumbai Central", dstCode: "MMCT", dep: "16:55", arr: "08:35", dur: "15h 40m", type: "Rajdhani", base: 450, stops: ["Kota Junction", "Vadodara Junction", "Surat", "Borivali"] },
  { number: "12953", name: "August Kranti Rajdhani", src: "Hazrat Nizamuddin", srcCode: "NZM", dst: "Mumbai Central", dstCode: "MMCT", dep: "17:40", arr: "10:55", dur: "17h 15m", type: "Rajdhani", base: 440, stops: ["Kota Junction", "Vadodara Junction", "Surat"] },
  { number: "12137", name: "Punjab Mail", src: "New Delhi", srcCode: "NDLS", dst: "Mumbai CSMT", dstCode: "CSMT", dep: "21:10", arr: "20:05", dur: "22h 55m", type: "Mail/Express", base: 350, stops: ["Mathura Junction", "Kota Junction", "Vadodara Junction", "Surat", "Nashik Road", "Kalyan Junction"] },
  { number: "12903", name: "Golden Temple Mail", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Amritsar Junction", dstCode: "ASR", dep: "21:00", arr: "06:10", dur: "33h 10m", type: "Mail/Express", base: 550, stops: ["Nashik Road", "Bhopal Junction", "Jhansi Junction", "Agra Cantt", "New Delhi"] },
  { number: "12925", name: "Paschim Express", src: "Bandra Terminus", srcCode: "BDTS", dst: "Amritsar Junction", dstCode: "ASR", dep: "11:40", arr: "19:55", dur: "32h 15m", type: "Superfast", base: 500, stops: ["Surat", "Vadodara Junction", "Kota Junction", "New Delhi", "Ludhiana Junction"] },
  { number: "22209", name: "Mumbai Duronto Express", src: "New Delhi", srcCode: "NDLS", dst: "Mumbai Central", dstCode: "MMCT", dep: "23:00", arr: "15:55", dur: "16h 55m", type: "Duronto", base: 460, stops: [] },
  { number: "12909", name: "Garib Rath Express", src: "Hazrat Nizamuddin", srcCode: "NZM", dst: "Bandra Terminus", dstCode: "BDTS", dep: "14:30", arr: "06:10", dur: "15h 40m", type: "Garib Rath", base: 320, stops: ["Kota Junction", "Vadodara Junction"] },
  { number: "12617", name: "Mangala Lakshadweep Express", src: "Hazrat Nizamuddin", srcCode: "NZM", dst: "Ernakulam Junction", dstCode: "ERS", dep: "08:45", arr: "21:50", dur: "37h 05m", type: "Superfast", base: 580, stops: ["Bhopal Junction", "Nagpur Junction", "Pune Junction", "Goa (Madgaon)", "Mangalore Central", "Kozhikode"] },

  // Delhi - Kolkata
  { number: "12301", name: "Howrah Rajdhani Express", src: "New Delhi", srcCode: "NDLS", dst: "Howrah Junction", dstCode: "HWH", dep: "16:55", arr: "09:55", dur: "17h 00m", type: "Rajdhani", base: 420, stops: ["Kanpur Central", "Allahabad Junction", "Mughal Sarai Junction", "Gaya Junction", "Dhanbad Junction"] },
  { number: "12303", name: "Poorva Express", src: "New Delhi", srcCode: "NDLS", dst: "Howrah Junction", dstCode: "HWH", dep: "20:30", arr: "23:40", dur: "27h 10m", type: "Superfast", base: 380, stops: ["Kanpur Central", "Allahabad Junction", "Mughal Sarai Junction", "Asansol Junction", "Durgapur"] },
  { number: "12305", name: "Kolkata Rajdhani Express", src: "New Delhi", srcCode: "NDLS", dst: "Howrah Junction", dstCode: "HWH", dep: "16:50", arr: "09:45", dur: "16h 55m", type: "Rajdhani", base: 430, stops: ["Kanpur Central", "Allahabad Junction", "Mughal Sarai Junction"] },
  { number: "12259", name: "Sealdah Duronto Express", src: "New Delhi", srcCode: "NDLS", dst: "Sealdah", dstCode: "SDAH", dep: "20:10", arr: "11:30", dur: "15h 20m", type: "Duronto", base: 440, stops: [] },

  // Delhi - Chennai
  { number: "12621", name: "Tamil Nadu Express", src: "New Delhi", srcCode: "NDLS", dst: "Chennai Central", dstCode: "MAS", dep: "22:30", arr: "07:10", dur: "32h 40m", type: "Superfast", base: 520, stops: ["Agra Cantt", "Jhansi Junction", "Bhopal Junction", "Nagpur Junction", "Vijayawada Junction"] },
  { number: "12615", name: "Grand Trunk Express", src: "New Delhi", srcCode: "NDLS", dst: "Chennai Central", dstCode: "MAS", dep: "18:40", arr: "06:30", dur: "35h 50m", type: "Express", base: 480, stops: ["Agra Cantt", "Jhansi Junction", "Bhopal Junction", "Nagpur Junction", "Vijayawada Junction"] },
  { number: "22691", name: "Rajdhani Express (Chennai)", src: "Hazrat Nizamuddin", srcCode: "NZM", dst: "Chennai Central", dstCode: "MAS", dep: "15:55", arr: "20:10", dur: "28h 15m", type: "Rajdhani", base: 550, stops: ["Agra Cantt", "Jhansi Junction", "Bhopal Junction", "Nagpur Junction"] },

  // Delhi - Bangalore
  { number: "12627", name: "Karnataka Express", src: "New Delhi", srcCode: "NDLS", dst: "Bangalore City", dstCode: "SBC", dep: "21:15", arr: "06:40", dur: "33h 25m", type: "Superfast", base: 540, stops: ["Agra Cantt", "Jhansi Junction", "Bhopal Junction", "Raichur", "Guntakal"] },
  { number: "22691", name: "Bangalore Rajdhani Express", src: "Hazrat Nizamuddin", srcCode: "NZM", dst: "Bangalore City", dstCode: "SBC", dep: "20:50", arr: "06:10", dur: "33h 20m", type: "Rajdhani", base: 580, stops: ["Agra Cantt", "Jhansi Junction", "Bhopal Junction", "Secunderabad Junction"] },

  // Delhi - Hyderabad
  { number: "12723", name: "Telangana Express", src: "New Delhi", srcCode: "NDLS", dst: "Hyderabad Deccan", dstCode: "HYB", dep: "06:25", arr: "08:30", dur: "26h 05m", type: "Superfast", base: 440, stops: ["Agra Cantt", "Jhansi Junction", "Bhopal Junction", "Nagpur Junction"] },
  { number: "12437", name: "Secunderabad Rajdhani", src: "Hazrat Nizamuddin", srcCode: "NZM", dst: "Secunderabad Junction", dstCode: "SC", dep: "17:05", arr: "14:50", dur: "21h 45m", type: "Rajdhani", base: 490, stops: ["Bhopal Junction", "Nagpur Junction"] },

  // Delhi - Ahmedabad
  { number: "12957", name: "Swarna Jayanti Rajdhani", src: "New Delhi", srcCode: "NDLS", dst: "Ahmedabad Junction", dstCode: "ADI", dep: "19:55", arr: "05:40", dur: "9h 45m", type: "Rajdhani", base: 350, stops: ["Jaipur Junction"] },
  { number: "12915", name: "Ashram Express", src: "New Delhi", srcCode: "NDLS", dst: "Ahmedabad Junction", dstCode: "ADI", dep: "15:20", arr: "06:20", dur: "15h 00m", type: "Express", base: 280, stops: ["Mathura Junction", "Kota Junction", "Udaipur City"] },

  // Delhi - Jaipur
  { number: "12985", name: "Jaipur Double Decker", src: "New Delhi", srcCode: "NDLS", dst: "Jaipur Junction", dstCode: "JP", dep: "06:00", arr: "10:35", dur: "4h 35m", type: "Superfast", base: 180, stops: [] },
  { number: "12015", name: "Ajmer Shatabdi Express", src: "New Delhi", srcCode: "NDLS", dst: "Ajmer Junction", dstCode: "AII", dep: "06:05", arr: "12:35", dur: "6h 30m", type: "Shatabdi", base: 250, stops: ["Jaipur Junction"] },
  { number: "12413", name: "Pooja Express", src: "New Delhi", srcCode: "NDLS", dst: "Jaipur Junction", dstCode: "JP", dep: "16:30", arr: "21:55", dur: "5h 25m", type: "Express", base: 150, stops: ["Rewari Junction"] },

  // Delhi - Lucknow
  { number: "12003", name: "Lucknow Shatabdi Express", src: "New Delhi", srcCode: "NDLS", dst: "Lucknow Charbagh", dstCode: "LKO", dep: "06:10", arr: "12:40", dur: "6h 30m", type: "Shatabdi", base: 240, stops: ["Kanpur Central"] },
  { number: "12229", name: "Lucknow Mail", src: "New Delhi", srcCode: "NDLS", dst: "Lucknow Charbagh", dstCode: "LKO", dep: "22:20", arr: "06:25", dur: "8h 05m", type: "Mail/Express", base: 200, stops: ["Aligarh Junction", "Kanpur Central"] },

  // Delhi - Varanasi
  { number: "12559", name: "Shiv Ganga Express", src: "New Delhi", srcCode: "NDLS", dst: "Varanasi Junction", dstCode: "BSB", dep: "18:50", arr: "06:30", dur: "11h 40m", type: "Superfast", base: 280, stops: ["Kanpur Central", "Allahabad Junction"] },

  // Delhi - Patna
  { number: "12393", name: "Sampoorna Kranti Express", src: "New Delhi", srcCode: "NDLS", dst: "Patna Junction", dstCode: "PNBE", dep: "22:15", arr: "12:35", dur: "14h 20m", type: "Superfast", base: 340, stops: ["Kanpur Central", "Allahabad Junction", "Mughal Sarai Junction"] },
  { number: "12309", name: "Rajdhani Express (Patna)", src: "New Delhi", srcCode: "NDLS", dst: "Patna Junction", dstCode: "PNBE", dep: "17:05", arr: "05:25", dur: "12h 20m", type: "Rajdhani", base: 400, stops: ["Kanpur Central", "Allahabad Junction"] },

  // Mumbai - Chennai
  { number: "12163", name: "Dadar Chennai Express", src: "Dadar", srcCode: "DR", dst: "Chennai Central", dstCode: "MAS", dep: "14:00", arr: "14:50", dur: "24h 50m", type: "Superfast", base: 420, stops: ["Pune Junction", "Solapur Junction", "Guntakal", "Renigunta Junction"] },
  { number: "11041", name: "Mumbai Chennai Express", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Chennai Central", dstCode: "MAS", dep: "21:00", arr: "23:00", dur: "26h 00m", type: "Express", base: 380, stops: ["Pune Junction", "Solapur Junction", "Vijayawada Junction"] },

  // Mumbai - Kolkata
  { number: "12809", name: "Mumbai Howrah Mail", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Howrah Junction", dstCode: "HWH", dep: "21:30", arr: "04:45", dur: "31h 15m", type: "Mail/Express", base: 480, stops: ["Nashik Road", "Bhopal Junction", "Allahabad Junction", "Mughal Sarai Junction", "Dhanbad Junction", "Asansol Junction"] },
  { number: "12261", name: "Howrah Duronto Express", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Howrah Junction", dstCode: "HWH", dep: "21:05", arr: "22:30", dur: "25h 25m", type: "Duronto", base: 520, stops: [] },

  // Mumbai - Bangalore
  { number: "12027", name: "Bangalore Shatabdi Express", src: "Chennai Central", srcCode: "MAS", dst: "Bangalore City", dstCode: "SBC", dep: "06:00", arr: "11:00", dur: "5h 00m", type: "Shatabdi", base: 220, stops: ["Katpadi Junction"] },
  { number: "11013", name: "Mumbai LTT Coimbatore Express", src: "Lokmanya Tilak Terminus", srcCode: "LTT", dst: "Coimbatore Junction", dstCode: "CBE", dep: "07:10", arr: "10:10", dur: "27h 00m", type: "Express", base: 450, stops: ["Pune Junction", "Goa (Madgaon)", "Mangalore Central", "Kozhikode", "Ernakulam Junction"] },

  // Mumbai - Goa
  { number: "12133", name: "Mumbai CSMT Mangalore Express", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Mangalore Central", dstCode: "MAQ", dep: "22:00", arr: "14:30", dur: "16h 30m", type: "Superfast", base: 320, stops: ["Ratnagiri", "Goa (Madgaon)"] },
  { number: "10103", name: "Mandovi Express", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Goa (Madgaon)", dstCode: "MAO", dep: "07:10", arr: "19:10", dur: "12h 00m", type: "Express", base: 260, stops: ["Panvel", "Ratnagiri", "Kankavli"] },

  // Chennai - Bangalore
  { number: "12607", name: "Lalbagh Express", src: "Chennai Central", srcCode: "MAS", dst: "Bangalore City", dstCode: "SBC", dep: "06:15", arr: "11:15", dur: "5h 00m", type: "Superfast", base: 190, stops: ["Katpadi Junction", "Jolarpettai"] },
  { number: "12609", name: "Chennai Bangalore Express", src: "Chennai Central", srcCode: "MAS", dst: "Bangalore City", dstCode: "SBC", dep: "14:10", arr: "19:50", dur: "5h 40m", type: "Superfast", base: 180, stops: ["Katpadi Junction"] },

  // Chennai - Hyderabad
  { number: "12603", name: "Hyderabad Express", src: "Chennai Central", srcCode: "MAS", dst: "Hyderabad Deccan", dstCode: "HYB", dep: "18:05", arr: "07:30", dur: "13h 25m", type: "Superfast", base: 300, stops: ["Vijayawada Junction", "Warangal"] },
  { number: "12759", name: "Charminar Express", src: "Chennai Central", srcCode: "MAS", dst: "Hyderabad Deccan", dstCode: "HYB", dep: "18:45", arr: "06:20", dur: "11h 35m", type: "Superfast", base: 280, stops: ["Vijayawada Junction"] },

  // Kolkata - Chennai
  { number: "12839", name: "Howrah Chennai Mail", src: "Howrah Junction", srcCode: "HWH", dst: "Chennai Central", dstCode: "MAS", dep: "23:50", arr: "05:00", dur: "29h 10m", type: "Mail/Express", base: 440, stops: ["Vijayawada Junction", "Visakhapatnam"] },
  { number: "12841", name: "Coromandel Express", src: "Howrah Junction", srcCode: "HWH", dst: "Chennai Central", dstCode: "MAS", dep: "14:50", arr: "17:35", dur: "26h 45m", type: "Superfast", base: 420, stops: ["Bhubaneswar", "Visakhapatnam", "Vijayawada Junction"] },

  // Kolkata - Mumbai
  { number: "12810", name: "Howrah Mumbai Mail", src: "Howrah Junction", srcCode: "HWH", dst: "Mumbai CSMT", dstCode: "CSMT", dep: "20:55", arr: "04:15", dur: "31h 20m", type: "Mail/Express", base: 480, stops: ["Asansol Junction", "Dhanbad Junction", "Allahabad Junction", "Bhopal Junction", "Nashik Road"] },

  // Bangalore - Hyderabad
  { number: "12785", name: "Bangalore Secunderabad Express", src: "Bangalore City", srcCode: "SBC", dst: "Secunderabad Junction", dstCode: "SC", dep: "20:00", arr: "08:30", dur: "12h 30m", type: "Express", base: 280, stops: ["Guntakal", "Kurnool", "Mahbubnagar"] },

  // Delhi - Dehradun
  { number: "12017", name: "Dehradun Shatabdi Express", src: "New Delhi", srcCode: "NDLS", dst: "Dehradun", dstCode: "DDN", dep: "06:45", arr: "12:30", dur: "5h 45m", type: "Shatabdi", base: 220, stops: ["Haridwar Junction"] },

  // Delhi - Amritsar
  { number: "12013", name: "Amritsar Shatabdi Express", src: "New Delhi", srcCode: "NDLS", dst: "Amritsar Junction", dstCode: "ASR", dep: "07:20", arr: "13:30", dur: "6h 10m", type: "Shatabdi", base: 240, stops: ["Ludhiana Junction", "Jalandhar City"] },
  { number: "12029", name: "Swarna Shatabdi Express", src: "New Delhi", srcCode: "NDLS", dst: "Amritsar Junction", dstCode: "ASR", dep: "16:30", arr: "22:45", dur: "6h 15m", type: "Shatabdi", base: 250, stops: ["Ambala Cantt", "Ludhiana Junction", "Jalandhar City"] },

  // Delhi - Jammu
  { number: "12425", name: "Jammu Rajdhani Express", src: "New Delhi", srcCode: "NDLS", dst: "Jammu Tawi", dstCode: "JAT", dep: "20:20", arr: "06:05", dur: "9h 45m", type: "Rajdhani", base: 350, stops: ["Ludhiana Junction", "Jalandhar City", "Pathankot"] },

  // Mumbai - Ahmedabad
  { number: "12009", name: "Mumbai Ahmedabad Shatabdi", src: "Mumbai Central", srcCode: "MMCT", dst: "Ahmedabad Junction", dstCode: "ADI", dep: "06:25", arr: "13:05", dur: "6h 40m", type: "Shatabdi", base: 230, stops: ["Surat", "Vadodara Junction"] },
  { number: "12935", name: "Bandra Terminus Ahmedabad Express", src: "Bandra Terminus", srcCode: "BDTS", dst: "Ahmedabad Junction", dstCode: "ADI", dep: "17:10", arr: "00:05", dur: "6h 55m", type: "Superfast", base: 200, stops: ["Surat", "Vadodara Junction"] },

  // Kolkata - Patna
  { number: "12023", name: "Howrah Janshatabdi Express", src: "Howrah Junction", srcCode: "HWH", dst: "Patna Junction", dstCode: "PNBE", dep: "06:05", arr: "13:40", dur: "7h 35m", type: "Superfast", base: 200, stops: ["Asansol Junction", "Dhanbad Junction", "Gaya Junction"] },

  // Bangalore - Chennai
  { number: "12657", name: "Bangalore Chennai Mail", src: "Bangalore City", srcCode: "SBC", dst: "Chennai Central", dstCode: "MAS", dep: "22:40", arr: "04:50", dur: "6h 10m", type: "Mail/Express", base: 180, stops: ["Katpadi Junction", "Jolarpettai"] },

  // Hyderabad - Bangalore
  { number: "12786", name: "Secunderabad Bangalore Express", src: "Secunderabad Junction", srcCode: "SC", dst: "Bangalore City", dstCode: "SBC", dep: "17:00", arr: "05:30", dur: "12h 30m", type: "Express", base: 280, stops: ["Mahbubnagar", "Kurnool", "Guntakal"] },

  // Bhubaneswar - Delhi
  { number: "12801", name: "Purushottam Express", src: "Puri", srcCode: "PURI", dst: "New Delhi", dstCode: "NDLS", dep: "20:25", arr: "05:15", dur: "30h 50m", type: "Superfast", base: 480, stops: ["Bhubaneswar", "Cuttack Junction", "Visakhapatnam", "Allahabad Junction", "Kanpur Central"] },

  // Guwahati - Delhi
  { number: "12423", name: "Dibrugarh Rajdhani Express", src: "Dibrugarh", srcCode: "DBRG", dst: "New Delhi", dstCode: "NDLS", dep: "19:50", arr: "10:15", dur: "38h 25m", type: "Rajdhani", base: 600, stops: ["Guwahati", "New Jalpaiguri", "Patna Junction", "Allahabad Junction", "Kanpur Central"] },

  // Kerala routes
  { number: "12625", name: "Kerala Express", src: "New Delhi", srcCode: "NDLS", dst: "Thiruvananthapuram Central", dstCode: "TVC", dep: "11:25", arr: "04:55", dur: "41h 30m", type: "Superfast", base: 620, stops: ["Nagpur Junction", "Ernakulam Junction", "Kozhikode", "Thrissur"] },
  { number: "16301", name: "Venad Express", src: "Ernakulam Junction", srcCode: "ERS", dst: "Thiruvananthapuram Central", dstCode: "TVC", dep: "14:10", arr: "18:40", dur: "4h 30m", type: "Express", base: 120, stops: ["Kottayam", "Alappuzha"] },

  // Pune routes
  { number: "12123", name: "Deccan Queen", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Pune Junction", dstCode: "PUNE", dep: "07:15", arr: "10:30", dur: "3h 15m", type: "Superfast", base: 150, stops: ["Lonavala"] },
  { number: "12127", name: "Mumbai Pune Intercity Express", src: "Mumbai CSMT", srcCode: "CSMT", dst: "Pune Junction", dstCode: "PUNE", dep: "17:10", arr: "20:30", dur: "3h 20m", type: "Superfast", base: 140, stops: ["Karjat", "Lonavala"] },
];

// Generate additional trains to reach 600+
function generateAdditionalTrains(): TrainTemplate[] {
  const routes: [string, string, string, string, string, string, string, string[]][] = [
    ["New Delhi", "NDLS", "Gorakhpur Junction", "GKP", "22:15", "08:10", "9h 55m", ["Lucknow Charbagh"]],
    ["New Delhi", "NDLS", "Ranchi", "RNC", "20:05", "16:30", "20h 25m", ["Allahabad Junction", "Mughal Sarai Junction", "Gaya Junction", "Dhanbad Junction"]],
    ["New Delhi", "NDLS", "Bhubaneswar", "BBS", "16:50", "03:15", "34h 25m", ["Kanpur Central", "Allahabad Junction", "Visakhapatnam"]],
    ["Mumbai CSMT", "CSMT", "Nagpur Junction", "NGP", "21:10", "09:30", "12h 20m", ["Nashik Road", "Bhusaval"]],
    ["Mumbai CSMT", "CSMT", "Bhopal Junction", "BPL", "20:25", "10:30", "14h 05m", ["Nashik Road", "Bhusaval", "Itarsi"]],
    ["Chennai Central", "MAS", "Coimbatore Junction", "CBE", "23:00", "06:25", "7h 25m", ["Salem Junction", "Erode"]],
    ["Chennai Central", "MAS", "Madurai Junction", "MDU", "21:30", "06:00", "8h 30m", ["Trichy Junction", "Dindigul"]],
    ["Chennai Central", "MAS", "Thiruvananthapuram Central", "TVC", "15:00", "07:30", "16h 30m", ["Ernakulam Junction", "Alappuzha"]],
    ["Howrah Junction", "HWH", "Bangalore City", "SBC", "20:35", "05:10", "32h 35m", ["Visakhapatnam", "Vijayawada Junction"]],
    ["Howrah Junction", "HWH", "New Jalpaiguri", "NJP", "22:05", "06:30", "8h 25m", ["Asansol Junction", "Malda Town"]],
    ["Howrah Junction", "HWH", "Guwahati", "GHY", "15:50", "08:15", "16h 25m", ["New Jalpaiguri"]],
    ["Bangalore City", "SBC", "Mangalore Central", "MAQ", "22:00", "06:00", "8h 00m", ["Mysore Junction", "Hassan"]],
    ["Bangalore City", "SBC", "Hubli Junction", "UBL", "23:10", "08:00", "8h 50m", ["Tumkur", "Davangere"]],
    ["Secunderabad Junction", "SC", "Vijayawada Junction", "BZA", "06:00", "12:00", "6h 00m", ["Warangal", "Khammam"]],
    ["Secunderabad Junction", "SC", "Nagpur Junction", "NGP", "19:00", "06:00", "11h 00m", ["Adilabad"]],
    ["Ahmedabad Junction", "ADI", "Jaipur Junction", "JP", "23:40", "10:20", "10h 40m", ["Abu Road", "Udaipur City"]],
    ["Jaipur Junction", "JP", "Jodhpur Junction", "JU", "06:00", "11:30", "5h 30m", ["Merta Road"]],
    ["Lucknow Charbagh", "LKO", "Varanasi Junction", "BSB", "22:30", "06:00", "7h 30m", ["Allahabad Junction"]],
    ["Lucknow Charbagh", "LKO", "Gorakhpur Junction", "GKP", "05:30", "11:15", "5h 45m", ["Barabanki"]],
    ["Patna Junction", "PNBE", "Ranchi", "RNC", "22:00", "05:30", "7h 30m", ["Gaya Junction", "Koderma"]],
    ["Bhopal Junction", "BPL", "Indore Junction", "INDB", "06:15", "11:30", "5h 15m", ["Ujjain Junction"]],
    ["Bhopal Junction", "BPL", "Jabalpur Junction", "JBP", "15:00", "21:00", "6h 00m", ["Itarsi", "Narsinghpur"]],
    ["Pune Junction", "PUNE", "Nagpur Junction", "NGP", "16:30", "05:00", "12h 30m", ["Solapur Junction"]],
    ["Pune Junction", "PUNE", "Hyderabad Deccan", "HYB", "17:15", "06:15", "13h 00m", ["Solapur Junction", "Gulbarga"]],
    ["Surat", "ST", "Jaipur Junction", "JP", "20:00", "10:30", "14h 30m", ["Ahmedabad Junction"]],
    ["Vadodara Junction", "BRC", "New Delhi", "NDLS", "14:30", "06:00", "15h 30m", ["Kota Junction"]],
    ["Visakhapatnam", "VSKP", "Hyderabad Deccan", "HYB", "19:00", "07:00", "12h 00m", ["Vijayawada Junction"]],
    ["Guwahati", "GHY", "Kolkata", "KOAA", "16:00", "06:30", "14h 30m", ["New Jalpaiguri"]],
    ["Thiruvananthapuram Central", "TVC", "Chennai Central", "MAS", "15:30", "07:00", "15h 30m", ["Ernakulam Junction", "Coimbatore Junction"]],
    ["Dehradun", "DDN", "Varanasi Junction", "BSB", "22:00", "14:30", "16h 30m", ["Lucknow Charbagh"]],
    ["Amritsar Junction", "ASR", "Kolkata", "KOAA", "05:30", "12:30", "31h 00m", ["New Delhi", "Kanpur Central", "Allahabad Junction"]],
    ["Jammu Tawi", "JAT", "Mumbai Central", "MMCT", "11:00", "03:00", "40h 00m", ["New Delhi", "Kota Junction", "Vadodara Junction"]],
    ["Raipur Junction", "R", "New Delhi", "NDLS", "14:00", "10:30", "20h 30m", ["Nagpur Junction", "Bhopal Junction", "Jhansi Junction"]],
    ["Bilaspur Junction", "BSP", "Howrah Junction", "HWH", "19:00", "12:00", "17h 00m", ["Raipur Junction", "Nagpur Junction"]],
    ["Chandigarh", "CDG", "Mumbai Central", "MMCT", "08:00", "14:00", "30h 00m", ["New Delhi", "Kota Junction"]],
    ["Mangalore Central", "MAQ", "Chennai Central", "MAS", "21:00", "12:00", "15h 00m", ["Kozhikode", "Ernakulam Junction"]],
    ["Kozhikode", "CLT", "Chennai Central", "MAS", "18:00", "08:00", "14h 00m", ["Coimbatore Junction", "Salem Junction"]],
    ["Mysore Junction", "MYS", "Chennai Central", "MAS", "19:00", "07:00", "12h 00m", ["Bangalore City"]],
    ["New Jalpaiguri", "NJP", "New Delhi", "NDLS", "15:00", "10:30", "19h 30m", ["Patna Junction", "Allahabad Junction"]],
    ["Kota Junction", "KOTA", "Howrah Junction", "HWH", "12:00", "10:00", "22h 00m", ["Allahabad Junction", "Mughal Sarai Junction"]],
  ];

  const types = ["Express", "Superfast", "Mail/Express", "Express", "Superfast"];
  const result: TrainTemplate[] = [];
  let baseNumber = 13001;

  for (const [src, srcCode, dst, dstCode, dep, arr, dur, stops] of routes) {
    // Create 5-8 variations per route
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const suffix = i === 0 ? "Express" : i === 1 ? "Superfast" : i === 2 ? "Mail" : i === 3 ? "Special" : "Fast Passenger";
      result.push({
        number: String(baseNumber++),
        name: `${src.split(" ")[0]} ${dst.split(" ")[0]} ${suffix}`,
        src, srcCode, dst, dstCode, dep, arr, dur, type,
        base: 150 + Math.floor(Math.random() * 300),
        stops,
      });
    }
  }

  // Additional popular route variants
  const popularRoutes: [string, string, string, string][] = [
    ["New Delhi", "NDLS", "Mumbai Central", "MMCT"],
    ["New Delhi", "NDLS", "Chennai Central", "MAS"],
    ["New Delhi", "NDLS", "Howrah Junction", "HWH"],
    ["Mumbai CSMT", "CSMT", "Chennai Central", "MAS"],
    ["Mumbai CSMT", "CSMT", "Howrah Junction", "HWH"],
    ["Chennai Central", "MAS", "Bangalore City", "SBC"],
    ["Howrah Junction", "HWH", "Patna Junction", "PNBE"],
    ["New Delhi", "NDLS", "Lucknow Charbagh", "LKO"],
    ["New Delhi", "NDLS", "Jaipur Junction", "JP"],
    ["Mumbai Central", "MMCT", "Ahmedabad Junction", "ADI"],
  ];

  for (const [src, srcCode, dst, dstCode] of popularRoutes) {
    for (let i = 0; i < 8; i++) {
      const h = 5 + Math.floor(Math.random() * 18);
      const m = Math.floor(Math.random() * 6) * 10;
      const durH = 4 + Math.floor(Math.random() * 30);
      const type = types[i % types.length];
      result.push({
        number: String(baseNumber++),
        name: `${src.split(" ")[0]} ${dst.split(" ")[0]} ${type} ${i + 1}`,
        src, srcCode, dst, dstCode,
        dep: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        arr: `${String((h + durH) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        dur: `${durH}h ${m}m`,
        type,
        base: 150 + Math.floor(Math.random() * 400),
        stops: [],
      });
    }
  }

  return result;
}

const additionalTemplates = generateAdditionalTrains();
const allTemplates = [...templates, ...additionalTemplates];

export const trains: Train[] = allTemplates.map((t) => ({
  train_number: t.number,
  train_name: t.name,
  source_station: t.src,
  source_code: t.srcCode,
  destination_station: t.dst,
  destination_code: t.dstCode,
  departure_time: t.dep,
  arrival_time: t.arr,
  journey_duration: t.dur,
  train_type: t.type,
  classes: makeClasses(t.base, t.type),
  intermediate_stops: t.stops,
  runs_on: allDays,
}));

export function searchTrains(sourceCode: string, destCode: string): Train[] {
  return trains.filter(
    (t) => t.source_code === sourceCode && t.destination_code === destCode
  );
}

export function getTrainByNumber(number: string): Train | undefined {
  return trains.find((t) => t.train_number === number);
}
