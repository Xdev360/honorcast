-- Run in Supabase SQL Editor (adds fields for event detail pages + admin)
alter table events
  add column if not exists location text default 'Disclosed on booking',
  add column if not exists dress_code text default 'Elevated Casual',
  add column if not exists capacity text,
  add column if not exists includes jsonb,
  add column if not exists description_extra text,
  add column if not exists tier_standard_price integer,
  add column if not exists tier_vip_price integer;

update events set
  location   = coalesce(location, 'Disclosed on booking'),
  dress_code = coalesce(dress_code, 'Elevated Casual'),
  includes   = coalesce(includes, '["Full multi-course dinner with curated seasonal menu","Welcome cocktail reception upon arrival","Seated dinner alongside both celebrity ambassadors","Professional photographer on site — personal shots included","Exclusive Honor Culture gift placed at your seat","Signed memorabilia from both celebrities","Intimate post-dinner mixer — invited guests only"]'::jsonb)
where type = 'dinner';

update events set
  tier_standard_price = coalesce(tier_standard_price, 3000),
  tier_vip_price      = coalesce(tier_vip_price, 4500),
  includes = coalesce(includes, '["Luxury Mercedes-Benz Sprinter fleet throughout","3-night VIP hotel stay (4-star minimum)","All meals every day — breakfast, lunch and dinner","Elite gym access across 3 cities","Train alongside both HC celebrity ambassadors","3-piece HC performance outfit + GymTour hoodie","Branded bag, shaker and accessories","Signed memorabilia from both celebrities","Professional photo and video content delivered post-tour"]'::jsonb)
where type = 'gymtour';
