/** Official 48 teams — FIFA World Cup 2026 (groups + FIFA ranking at qualification) */
export interface Wc2026Team {
  name: string;
  code: string;
  flag_emoji: string;
  group_name: string;
  fifa_rank: number;
}

export const WC2026_TEAMS: Wc2026Team[] = [
  { name: "France", code: "FRA", flag_emoji: "🇫🇷", group_name: "I", fifa_rank: 1 },
  { name: "Spain", code: "ESP", flag_emoji: "🇪🇸", group_name: "H", fifa_rank: 2 },
  { name: "Argentina", code: "ARG", flag_emoji: "🇦🇷", group_name: "J", fifa_rank: 3 },
  { name: "England", code: "ENG", flag_emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group_name: "L", fifa_rank: 4 },
  { name: "Portugal", code: "POR", flag_emoji: "🇵🇹", group_name: "K", fifa_rank: 5 },
  { name: "Brazil", code: "BRA", flag_emoji: "🇧🇷", group_name: "C", fifa_rank: 6 },
  { name: "Netherlands", code: "NED", flag_emoji: "🇳🇱", group_name: "F", fifa_rank: 7 },
  { name: "Morocco", code: "MAR", flag_emoji: "🇲🇦", group_name: "C", fifa_rank: 8 },
  { name: "Belgium", code: "BEL", flag_emoji: "🇧🇪", group_name: "G", fifa_rank: 9 },
  { name: "Germany", code: "GER", flag_emoji: "🇩🇪", group_name: "E", fifa_rank: 10 },
  { name: "Croatia", code: "CRO", flag_emoji: "🇭🇷", group_name: "L", fifa_rank: 11 },
  { name: "Colombia", code: "COL", flag_emoji: "🇨🇴", group_name: "K", fifa_rank: 13 },
  { name: "Senegal", code: "SEN", flag_emoji: "🇸🇳", group_name: "I", fifa_rank: 14 },
  { name: "Mexico", code: "MEX", flag_emoji: "🇲🇽", group_name: "A", fifa_rank: 15 },
  { name: "USA", code: "USA", flag_emoji: "🇺🇸", group_name: "D", fifa_rank: 16 },
  { name: "Uruguay", code: "URU", flag_emoji: "🇺🇾", group_name: "H", fifa_rank: 17 },
  { name: "Japan", code: "JPN", flag_emoji: "🇯🇵", group_name: "F", fifa_rank: 18 },
  { name: "Switzerland", code: "SUI", flag_emoji: "🇨🇭", group_name: "B", fifa_rank: 19 },
  { name: "IR Iran", code: "IRN", flag_emoji: "🇮🇷", group_name: "G", fifa_rank: 21 },
  { name: "Türkiye", code: "TUR", flag_emoji: "🇹🇷", group_name: "D", fifa_rank: 22 },
  { name: "Ecuador", code: "ECU", flag_emoji: "🇪🇨", group_name: "E", fifa_rank: 23 },
  { name: "Austria", code: "AUT", flag_emoji: "🇦🇹", group_name: "J", fifa_rank: 24 },
  { name: "Korea Republic", code: "KOR", flag_emoji: "🇰🇷", group_name: "A", fifa_rank: 25 },
  { name: "Australia", code: "AUS", flag_emoji: "🇦🇺", group_name: "D", fifa_rank: 27 },
  { name: "Algeria", code: "ALG", flag_emoji: "🇩🇿", group_name: "J", fifa_rank: 28 },
  { name: "Egypt", code: "EGY", flag_emoji: "🇪🇬", group_name: "G", fifa_rank: 29 },
  { name: "Canada", code: "CAN", flag_emoji: "🇨🇦", group_name: "B", fifa_rank: 30 },
  { name: "Norway", code: "NOR", flag_emoji: "🇳🇴", group_name: "I", fifa_rank: 31 },
  { name: "Panama", code: "PAN", flag_emoji: "🇵🇦", group_name: "L", fifa_rank: 33 },
  { name: "Côte d'Ivoire", code: "CIV", flag_emoji: "🇨🇮", group_name: "E", fifa_rank: 34 },
  { name: "Sweden", code: "SWE", flag_emoji: "🇸🇪", group_name: "F", fifa_rank: 38 },
  { name: "Paraguay", code: "PAR", flag_emoji: "🇵🇾", group_name: "D", fifa_rank: 40 },
  { name: "Czechia", code: "CZE", flag_emoji: "🇨🇿", group_name: "A", fifa_rank: 41 },
  { name: "Scotland", code: "SCO", flag_emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group_name: "C", fifa_rank: 43 },
  { name: "Tunisia", code: "TUN", flag_emoji: "🇹🇳", group_name: "F", fifa_rank: 44 },
  { name: "Congo DR", code: "COD", flag_emoji: "🇨🇩", group_name: "K", fifa_rank: 46 },
  { name: "Uzbekistan", code: "UZB", flag_emoji: "🇺🇿", group_name: "K", fifa_rank: 50 },
  { name: "Qatar", code: "QAT", flag_emoji: "🇶🇦", group_name: "B", fifa_rank: 55 },
  { name: "Iraq", code: "IRQ", flag_emoji: "🇮🇶", group_name: "I", fifa_rank: 57 },
  { name: "South Africa", code: "RSA", flag_emoji: "🇿🇦", group_name: "A", fifa_rank: 60 },
  { name: "Saudi Arabia", code: "KSA", flag_emoji: "🇸🇦", group_name: "H", fifa_rank: 61 },
  { name: "Jordan", code: "JOR", flag_emoji: "🇯🇴", group_name: "J", fifa_rank: 63 },
  { name: "Bosnia and Herzegovina", code: "BIH", flag_emoji: "🇧🇦", group_name: "B", fifa_rank: 65 },
  { name: "Cabo Verde", code: "CPV", flag_emoji: "🇨🇻", group_name: "H", fifa_rank: 69 },
  { name: "Ghana", code: "GHA", flag_emoji: "🇬🇭", group_name: "L", fifa_rank: 74 },
  { name: "Curaçao", code: "CUW", flag_emoji: "🇨🇼", group_name: "E", fifa_rank: 82 },
  { name: "Haiti", code: "HAI", flag_emoji: "🇭🇹", group_name: "C", fifa_rank: 83 },
  { name: "New Zealand", code: "NZL", flag_emoji: "🇳🇿", group_name: "G", fifa_rank: 85 },
];

export const WC2026_GROUP_COUNT = 12;
export const WC2026_TEAM_COUNT = WC2026_TEAMS.length;
