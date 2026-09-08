-- TICKET 3 initial high-trust candidates.
-- These rows are private candidates, not public map features.
-- Serres has an exact coordinate exposed by the official circuit site's Google Maps link.
-- Megara remains blocked until an exact coordinate is verified from a primary/authority source.

with serres_source as (
  insert into public.automotive_map_sources (
    name, source_type, base_url, country_code, trust_level, active, notes, verified_at
  ) values (
    'Serres Racing Circuit',
    'official_venue',
    'https://serrescircuit.gr/',
    'GR',
    'high',
    true,
    'Official circuit website. Primary source for venue identity, location, operating hours and track-day calendar.',
    now()
  )
  on conflict (base_url) do update set
    name = excluded.name,
    source_type = excluded.source_type,
    trust_level = excluded.trust_level,
    active = excluded.active,
    notes = excluded.notes,
    verified_at = excluded.verified_at
  returning id
)
insert into public.automotive_map_candidates (
  external_key, status, feature_type, feature_subtype,
  title, title_el, summary, summary_el,
  country_code, city, region, location_text, location_text_el,
  latitude, longitude, source_id, source_url,
  public_access_status, driving_access_status, access_notes, access_source_url,
  access_verified_at, tags, verified_at
)
select
  'serres-racing-circuit',
  'verified',
  'track',
  'race_circuit',
  'Serres Racing Circuit',
  'Αυτοκινητοδρόμιο Σερρών',
  'Permanent motorsport circuit in Omonia Sports Park, southwest of Serres. The official circuit lists a 3.186 km track, operating hours and scheduled open track-day/free-training sessions.',
  'Μόνιμο αυτοκινητοδρόμιο στο Αθλητικό Πάρκο Ομονοίας, νοτιοδυτικά των Σερρών. Η επίσημη ιστοσελίδα αναφέρει πίστα 3,186 χλμ., ωράριο λειτουργίας και προγραμματισμένες ημέρες ελεύθερης προπόνησης.',
  'GR',
  'Serres',
  'Central Macedonia',
  'Omonia Sports Park, Serres, Greece',
  'Αθλητικό Πάρκο Ομονοίας, Σέρρες, Ελλάδα',
  41.07317,
  23.517207,
  serres_source.id,
  'https://serrescircuit.gr/en/',
  'conditional',
  'conditional',
  'Access and driving are subject to the circuit operating hours, event/track-day calendar and venue rules. This does not imply unrestricted track use.',
  'https://serrescircuit.gr/orario-leitourgias/',
  now(),
  array['circuit', 'motorsport', 'cars', 'motorcycles', 'track-day']::text[],
  now()
from serres_source
on conflict (external_key) do nothing;

with megara_source as (
  insert into public.automotive_map_sources (
    name, source_type, base_url, country_code, trust_level, active, notes, verified_at
  ) values (
    'Athens International Circuit / Galaxy Motorsports',
    'official_venue',
    'https://galaxymotorsports.gr/',
    'GR',
    'high',
    true,
    'Official operator website for Athens International Circuit at Megara.',
    now()
  )
  on conflict (base_url) do update set
    name = excluded.name,
    source_type = excluded.source_type,
    trust_level = excluded.trust_level,
    active = excluded.active,
    notes = excluded.notes,
    verified_at = excluded.verified_at
  returning id
)
insert into public.automotive_map_candidates (
  external_key, status, feature_type, feature_subtype,
  title, title_el, summary, summary_el,
  country_code, city, region, location_text, location_text_el,
  source_id, source_url,
  public_access_status, driving_access_status, access_notes, access_source_url,
  access_verified_at, tags, block_reason
)
select
  'athens-international-circuit-megara',
  'blocked',
  'track',
  'race_circuit',
  'Athens International Circuit (Megara)',
  'Athens International Circuit (Μέγαρα)',
  'Motorsport circuit operated by Galaxy Motorsports in the Megara/Pachi area. The official operator advertises car, motorcycle and kart track days and provides the venue address on the Athens-Corinth National Road.',
  'Αυτοκινητοδρόμιο της Galaxy Motorsports στην περιοχή Μεγάρων/Πάχης. Ο επίσημος διαχειριστής αναφέρει track days για αυτοκίνητα, μοτοσυκλέτες και kart και δημοσιεύει τη διεύθυνση της εγκατάστασης.',
  'GR',
  'Megara',
  'Attica',
  'National Road Athens - Corinth (41 km), Interchange, Pachi 191 00, Greece',
  'Ε.Ο. Αθηνών - Κορίνθου (41 χλμ.), Κόμβος, Πάχη 191 00, Ελλάδα',
  megara_source.id,
  'https://galaxymotorsports.gr/autokinhtodromio/',
  'conditional',
  'conditional',
  'Venue use is conditional on operator bookings, track-day schedules and rules.',
  'https://galaxymotorsports.gr/autokinhtodromio/',
  now(),
  array['circuit', 'motorsport', 'cars', 'motorcycles', 'kart']::text[],
  'exact_coordinates_not_verified_from_primary_source'
from megara_source
on conflict (external_key) do nothing;
