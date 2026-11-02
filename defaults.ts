// Everything here is the starting content. Hosts can change all of it live from
// the Host Studio (crown button on the cover photo); edits are saved to the
// `settings` table and override these values for every guest.

import { PLACEHOLDER_PORTRAIT } from './assets';

export type Side = 'bride' | 'groom';

export type Contact = { label: string; name: string; phone: string };

export type WeddingEvent = {
  id: string;
  name: string;
  start: string; // ISO date-time with offset, e.g. 2027-02-13T19:30:00+05:30
  venue: string;
  address: string;
  mapsQuery?: string; // optional "lat,lng" or place name; falls back to venue + address
  note?: string;
  contacts: Contact[];
};

export type WeddingInfo = {
  bride: string;
  groom: string;
  tagline: string;
  date: string; // the countdown target
  heroUrl: string;
  polaroidUrl: string;
  brideParents: string;
  groomParents: string;
  inviteLine: string;
};

export type Shuttle = { title: string; time: string; from: string; to: string };
export type Logistics = { shuttles: Shuttle[]; drivers: Contact[] };

export type TriviaQuestion = { id: string; q: string; options: string[]; answer: number };
export type Poll = { id: string; q: string; options: string[] };
export type Games = { trivia: TriviaQuestion[]; polls: Poll[] };

export type ThemeChoice = {
  palette: string;
  script: string;
  heading: string;
  body: string;
  motif: 'floral' | 'paisley' | 'mandala' | 'none';
};

export const DEFAULT_WEDDING: WeddingInfo = {
  bride: 'Pratha',
  groom: 'Nikhil',
  tagline: 'Two hearts, one beautiful journey',
  date: '2027-02-13T19:30:00+05:30',
  heroUrl: PLACEHOLDER_PORTRAIT,
  polaroidUrl: PLACEHOLDER_PORTRAIT,
  brideParents: 'Mrs. Neelam & Mr. Rajesh Mehra',
  groomParents: 'Mrs. Sunita & Mr. Vikram Malhotra',
  inviteLine: 'request the pleasure of your company as we celebrate the wedding of their children',
};

export const DEFAULT_EVENTS: WeddingEvent[] = [
  {
    id: 'engagement',
    name: 'Engagement',
    start: '2027-02-10T19:00:00+05:30',
    venue: 'The Crystal Ballroom, JW Marriott',
    address: 'Replace with the full venue address, City 000000',
    note: 'Dress code: Indo-western, jewel tones',
    contacts: [
      { label: 'Manager', name: 'Rohan', phone: '+919000000001' },
      { label: "Groom's Father", name: 'Vikram', phone: '+919000000002' },
    ],
  },
  {
    id: 'haldi',
    name: 'Haldi',
    start: '2027-02-11T10:00:00+05:30',
    venue: 'Poolside Lawns, JW Marriott',
    address: 'Replace with the full venue address, City 000000',
    note: 'Wear yellow and clothes you don’t mind getting messy',
    contacts: [{ label: 'Event Manager', name: 'Priya', phone: '+919000000003' }],
  },
  {
    id: 'mehndi',
    name: 'Mehndi',
    start: '2027-02-11T16:00:00+05:30',
    venue: 'Garden Courtyard, JW Marriott',
    address: 'Replace with the full venue address, City 000000',
    note: 'Dress code: Greens and florals',
    contacts: [
      { label: 'Event Manager', name: 'Priya', phone: '+919000000003' },
      { label: 'Cook', name: 'Harish ji', phone: '+919000000004' },
    ],
  },
  {
    id: 'sangeet',
    name: 'Sangeet',
    start: '2027-02-12T19:00:00+05:30',
    venue: 'Grand Hall, JW Marriott',
    address: 'Replace with the full venue address, City 000000',
    note: 'Register your performance in the Sangeet tab',
    contacts: [{ label: 'Sound console', name: 'DJ Arjun', phone: '+919000000005' }],
  },
  {
    id: 'wedding',
    name: 'Wedding',
    start: '2027-02-13T19:30:00+05:30',
    venue: 'Town Hall',
    address: 'Replace with the full venue address, City 000000',
    note: 'Baraat assembles at 6:30 PM at the hotel porch',
    contacts: [
      { label: 'Logistics', name: 'Aman', phone: '+919000000006' },
      { label: "Groom's Father", name: 'Vikram', phone: '+919000000002' },
      { label: 'Cook', name: 'Harish ji', phone: '+919000000004' },
    ],
  },
];

export const DEFAULT_LOGISTICS: Logistics = {
  shuttles: [
    { title: 'Hotel to marriage venue', time: '6:00 PM', from: 'JW Marriott', to: 'Town Hall' },
    { title: 'Marriage to hotel post wedding', time: '11:00 PM', from: 'Town Hall', to: 'JW Marriott' },
    { title: 'Airport pickups', time: 'On arrival', from: 'Airport', to: 'JW Marriott' },
  ],
  drivers: [
    { label: 'Airport pickup', name: 'Devdas', phone: '+919000000011' },
    { label: 'Venue shuttle', name: 'Gurpreet', phone: '+919000000012' },
    { label: 'Transport coordinator', name: 'Aman', phone: '+919000000006' },
  ],
};

export const DEFAULT_GAMES: Games = {
  trivia: [
    { id: 't1', q: 'Where did Pratha and Nikhil first meet?', options: ['College library', 'A friend’s wedding', 'On a flight', 'At work'], answer: 1 },
    { id: 't2', q: 'Who said “I love you” first?', options: ['Pratha', 'Nikhil', 'Both at once', 'Still waiting'], answer: 0 },
    { id: 't3', q: 'What was their first trip together?', options: ['Goa', 'Rishikesh', 'Udaipur', 'Shimla'], answer: 2 },
    { id: 't4', q: 'Whose cooking does the other secretly prefer?', options: ['Pratha’s', 'Nikhil’s', 'Their moms’', 'Swiggy’s'], answer: 3 },
  ],
  polls: [
    { id: 'p1', q: 'Who will cry first at the pheras?', options: ['The bride', 'The groom', 'Bride’s dad', 'Groom’s mom'] },
    { id: 'p2', q: 'Which side will dance longer at the baraat?', options: ['Bride’s side', 'Groom’s side'] },
    { id: 'p3', q: 'Best dish of the week so far?', options: ['Dal makhani', 'Paneer tikka', 'Jalebi', 'Gol gappe'] },
  ],
};

export const DEFAULT_THEME: ThemeChoice = {
  palette: 'royal',
  script: 'Great Vibes',
  heading: 'Playfair Display',
  body: 'EB Garamond',
  motif: 'floral',
};
