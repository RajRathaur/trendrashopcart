
-- Seed common Indian pincodes for delivery availability
INSERT INTO public.delivery_pincodes (pincode, city, state, delivery_days, is_cod_available, is_active) VALUES
('110001','New Delhi','Delhi',3,true,true),
('110016','New Delhi','Delhi',3,true,true),
('201301','Noida','Uttar Pradesh',3,true,true),
('122001','Gurugram','Haryana',3,true,true),
('400001','Mumbai','Maharashtra',4,true,true),
('400050','Mumbai','Maharashtra',4,true,true),
('411001','Pune','Maharashtra',4,true,true),
('560001','Bengaluru','Karnataka',4,true,true),
('560034','Bengaluru','Karnataka',4,true,true),
('600001','Chennai','Tamil Nadu',5,true,true),
('600040','Chennai','Tamil Nadu',5,true,true),
('700001','Kolkata','West Bengal',5,true,true),
('500001','Hyderabad','Telangana',4,true,true),
('500081','Hyderabad','Telangana',4,true,true),
('380001','Ahmedabad','Gujarat',4,true,true),
('302001','Jaipur','Rajasthan',4,true,true),
('226001','Lucknow','Uttar Pradesh',5,true,true),
('160001','Chandigarh','Chandigarh',4,true,true),
('682001','Kochi','Kerala',6,true,true),
('751001','Bhubaneswar','Odisha',6,false,true),
('800001','Patna','Bihar',7,false,true),
('781001','Guwahati','Assam',8,false,true),
('190001','Srinagar','Jammu & Kashmir',9,false,true),
('403001','Panaji','Goa',6,true,true),
('462001','Bhopal','Madhya Pradesh',5,true,true)
ON CONFLICT DO NOTHING;

-- Enable realtime for live updates when admin changes availability
ALTER TABLE public.delivery_pincodes REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_pincodes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
