-- Seed data (optional) for local testing / first deploy

-- Storage buckets (required for upload features)
insert into storage.buckets (id, name, public)
values
  ('assignment-uploads','assignment-uploads', false),
  ('payment-proofs','payment-proofs', false),
  ('certificates','certificates', false),
  ('hackathon-entries','hackathon-entries', false)
on conflict (id) do nothing;

insert into public.tracks (code, name, description) values
  ('AI','AI','Artificial Intelligence track'),
  ('ROBOTICS','Robotics','Robotics & embedded systems track'),
  ('DRONE','Drone','Drone engineering track'),
  ('FULLSTACK','Full Stack','Full Stack web development track')
on conflict (code) do update set name = excluded.name;

-- 25-day baseline program (track_id NULL => common)
insert into public.program_days (day, title, topic, summary)
values
  (1,  'Orientation',                 'Welcome + Setup',                         'Program kickoff, tool setup, expectations'),
  (2,  'Problem Selection',           'Identify real problems',                   'Choose a problem statement and success metrics'),
  (3,  'Research',                    'User research & insights',                 'Interviews, surveys, and synthesis'),
  (4,  'Ideation',                    'Solution brainstorming',                   'Generate options and pick the best'),
  (5,  'MVP Plan',                    'Define MVP scope',                         'Build plan, milestones, and roles'),
  (6,  'Design',                      'UX wireframes',                            'Design the core flow'),
  (7,  'Prototype',                   'Clickable prototype',                      'Validate quickly with users'),
  (8,  'Build Sprint 1',              'Core features',                            'Start implementation'),
  (9,  'Build Sprint 2',              'Core features',                            'Continue implementation'),
  (10, 'Build Sprint 3',              'Core features',                            'Finish core'),
  (11, 'Testing',                     'Test plan + bug fixing',                   'Stability & performance'),
  (12, 'Iteration',                   'Improve based on feedback',                'Refine MVP'),
  (13, 'Pitch Prep',                  'Storytelling & pitch',                     'Narrative and demo'),
  (14, 'Mock Pitch',                  'Practice pitch',                           'Get feedback'),
  (15, 'Hackathon',                   'Mid-program hackathon',                    'Submit and present'),
  (16, 'Advanced Topic',              'Track deep dive',                          'AI/Robotics/Drone/FullStack specialization'),
  (17, 'Advanced Topic',              'Track deep dive',                          'Specialization'),
  (18, 'Advanced Topic',              'Track deep dive',                          'Specialization'),
  (19, 'Build Sprint 4',              'Polish product',                           'Add finishing touches'),
  (20, 'Build Sprint 5',              'Polish product',                           'Stability and UX'),
  (21, 'Docs',                        'Documentation',                            'Readme, architecture, usage'),
  (22, 'Metrics',                     'Measure outcomes',                         'Impact metrics and results'),
  (23, 'Demo Polish',                 'Demo + screenshots',                       'Demo quality improvements'),
  (24, 'Final Pitch',                 'Final rehearsal',                          'Last improvements'),
  (25, 'Demo Day',                    'Graduation & showcase',                    'Final presentations')
on conflict (day) do update set
  title = excluded.title,
  topic = excluded.topic,
  summary = excluded.summary;

-- Example class session (YouTube Live embed URL)
insert into public.class_sessions (title, day, youtube_live_url, is_live)
values ('Live Class (Sample)', 1, 'https://www.youtube.com/embed/dQw4w9WgXcQ', false)
on conflict do nothing;

-- Sample FAQ
insert into public.faqs (question, answer, sort_order) values
  ('How do I join the live class?', 'Open Live Class and click Join Live Class.', 1),
  ('How do I submit assignments?', 'Open Assignments, upload PDF/Image, and submit.', 2)
on conflict do nothing;

-- Sample hackathon
insert into public.hackathons (name, description) values
  ('Mid Program Hackathon', 'Submit your project and get evaluated by mentors/admins.')
on conflict do nothing;

-- Sample badges
insert into public.badges (code, name, description, icon) values
  ('FIRST_SUBMISSION', 'First Submission', 'Submitted your first assignment', '🏅'),
  ('STREAK_3', '3-Day Streak', 'Maintained a 3-day learning streak', '🔥'),
  ('HACKATHON_PARTICIPANT', 'Hackathon Participant', 'Participated in hackathon', '🏁')
on conflict (code) do nothing;

