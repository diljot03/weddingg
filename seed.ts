// Sample rows for demo mode only. Never used once Supabase is connected.

let seeded = false;

export function seedDemo(write: (table: string, rows: Record<string, any>[]) => void) {
  if (seeded || typeof window === 'undefined') return;
  seeded = true;
  if (localStorage.getItem('wedding-demo:seeded')) return;

  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  const g = (id: string, name: string, side: string, min: number) => ({
    id, name, side, role: 'guest', avatar_url: null, phone: null, face_descriptor: null, created_at: ago(min),
  });

  write('guests', [
    g('demo-1', 'Ishita Mehra', 'bride', 900),
    g('demo-2', 'Rahul Malhotra', 'groom', 860),
    g('demo-3', 'Simran Kaur', 'bride', 700),
    g('demo-4', 'Dev Arora', 'groom', 640),
    g('demo-5', 'Naina Kapoor', 'bride', 300),
  ]);
  write('announcements', [
    { id: 'a1', title: 'Welcome to the celebrations', body: 'Room keys and welcome hampers are at the JW Marriott front desk. Shuttle timings are in Logistics.', author_name: 'Hosts', created_at: ago(600) },
    { id: 'a2', title: 'Dinner menu', body: 'Tonight: live chaat counter, dal makhani, paneer tikka and a jalebi-rabri station from 8:30 PM.', author_name: 'Hosts', created_at: ago(45) },
  ]);
  write('messages', [
    { id: 'm1', sender_id: 'demo-1', sender_name: 'Ishita Mehra', side: 'bride', body: 'Landed! Who else is on the 4 PM shuttle?', created_at: ago(90) },
    { id: 'm2', sender_id: 'demo-4', sender_name: 'Dev Arora', side: 'groom', body: 'Me — saving seats in the back row 🙌', created_at: ago(84) },
    { id: 'm3', sender_id: 'demo-3', sender_name: 'Simran Kaur', side: 'bride', body: 'Mehndi artists are already set up in the courtyard, go early!', created_at: ago(30) },
  ]);
  write('songs', [
    { id: 's1', requester_id: 'demo-2', requester_name: 'Rahul Malhotra', title: 'London Thumakda', artist: 'Labh Janjua, Sonu Kakkar, Neha Kakkar', artwork_url: null, played: false, created_at: ago(200) },
    { id: 's2', requester_id: 'demo-1', requester_name: 'Ishita Mehra', title: 'Gallan Goodiyaan', artist: 'Shankar Mahadevan & others', artwork_url: null, played: false, created_at: ago(150) },
    { id: 's3', requester_id: 'demo-5', requester_name: 'Naina Kapoor', title: 'Kala Chashma', artist: 'Badshah, Neha Kakkar', artwork_url: null, played: false, created_at: ago(60) },
  ]);
  write('song_votes', [
    { song_id: 's1', guest_id: 'demo-1' }, { song_id: 's1', guest_id: 'demo-3' }, { song_id: 's1', guest_id: 'demo-4' },
    { song_id: 's3', guest_id: 'demo-2' },
  ]);
  write('performances', [
    { id: 'pf1', guest_id: 'demo-3', performer: 'Bride’s Cousins Squad', song_title: 'Navrai Majhi', audio_url: null, status: 'upcoming', created_at: ago(500) },
    { id: 'pf2', guest_id: 'demo-4', performer: 'Groom’s College Gang', song_title: 'Desi Girl', audio_url: null, status: 'upcoming', created_at: ago(400) },
  ]);
  write('trivia_answers', [
    { guest_id: 'demo-1', question_id: 't1', choice: 1, correct: true, side: 'bride', guest_name: 'Ishita Mehra' },
    { guest_id: 'demo-2', question_id: 't1', choice: 0, correct: false, side: 'groom', guest_name: 'Rahul Malhotra' },
    { guest_id: 'demo-4', question_id: 't3', choice: 2, correct: true, side: 'groom', guest_name: 'Dev Arora' },
  ]);
  localStorage.setItem('wedding-demo:seeded', '1');
}
