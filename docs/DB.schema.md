-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.appointments (
  id text NOT NULL,
  customer_id text,
  artist_id text,
  date timestamp without time zone,
  duration integer,
  status text NOT NULL DEFAULT 'pending'::text,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time timestamp without time zone,
  payment_id text,
  price_quote double precision,
  square_id text,
  start_time timestamp without time zone,
  tattoo_request_id text,
  type text,
  contact_email text,
  contact_phone text,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.users(id),
  CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT appointments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT appointments_tattoo_request_id_fkey FOREIGN KEY (tattoo_request_id) REFERENCES public.tattoo_requests(id)
);
CREATE TABLE public.audit_logs (
  id text NOT NULL,
  user_id text,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  details jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resource_type text,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.business_hours (
  id text NOT NULL,
  dayOfWeek integer NOT NULL,
  openTime text NOT NULL,
  closeTime text NOT NULL,
  isOpen boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT business_hours_pkey PRIMARY KEY (id)
);
CREATE TABLE public.checkout_sessions (
  id text NOT NULL,
  square_order_id text NOT NULL,
  customer_id text NOT NULL,
  appointment_id text,
  status text NOT NULL DEFAULT 'pending'::text,
  metadata jsonb,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT checkout_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT checkout_sessions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.customers (
  id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  square_id text,
  last_activity_date timestamp without time zone,
  email_unsubscribed boolean NOT NULL DEFAULT false,
  email_preferences jsonb,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_automation_logs (
  id text NOT NULL,
  customer_id text,
  appointment_id text,
  tattoo_request_id text,
  email_type text NOT NULL,
  email_address text NOT NULL,
  template_id text NOT NULL,
  sent_at timestamp without time zone NOT NULL,
  status text NOT NULL DEFAULT 'sent'::text,
  error text,
  metadata jsonb,
  CONSTRAINT email_automation_logs_pkey PRIMARY KEY (id),
  CONSTRAINT email_automation_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT email_automation_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT email_automation_logs_tattoo_request_id_fkey FOREIGN KEY (tattoo_request_id) REFERENCES public.tattoo_requests(id)
);
CREATE TABLE public.email_automation_settings (
  id text NOT NULL,
  email_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  timing_hours integer,
  timing_minutes integer,
  business_hours_only boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_automation_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_templates (
  id text NOT NULL,
  name text NOT NULL,
  displayName text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  htmlBody text,
  variables jsonb NOT NULL,
  isActive boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.images (
  id text NOT NULL,
  tattoo_request_id text,
  url text NOT NULL,
  public_id text NOT NULL,
  metadata jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT images_pkey PRIMARY KEY (id),
  CONSTRAINT images_tattoo_request_id_fkey FOREIGN KEY (tattoo_request_id) REFERENCES public.tattoo_requests(id)
);
CREATE TABLE public.invoices (
  id text NOT NULL,
  appointment_id text,
  payment_id text,
  amount double precision NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata jsonb,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT invoices_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.payment_links (
  id text NOT NULL,
  square_order_id text,
  customer_id text NOT NULL,
  appointment_id text,
  amount double precision NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  url text NOT NULL,
  metadata jsonb,
  enable_reminders boolean NOT NULL DEFAULT true,
  last_reminder_sent timestamp without time zone,
  reminder_count integer NOT NULL DEFAULT 0,
  reminder_schedule jsonb NOT NULL DEFAULT '[2, 7, 14]'::jsonb,
  expires_at timestamp without time zone,
  deleted_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payment_links_pkey PRIMARY KEY (id),
  CONSTRAINT payment_links_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.payments (
  id text NOT NULL,
  amount double precision NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  payment_method text,
  payment_details jsonb,
  square_id text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  booking_id text,
  customer_id text,
  payment_type text,
  reference_id text,
  refund_details jsonb,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.special_hours (
  id text NOT NULL,
  date date NOT NULL,
  openTime text,
  closeTime text,
  isClosed boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT special_hours_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tattoo_requests (
  id text NOT NULL,
  customer_id text,
  description text NOT NULL,
  placement text,
  size text,
  color_preference text,
  style text,
  reference_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new'::text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deposit_amount double precision,
  deposit_paid boolean NOT NULL DEFAULT false,
  final_amount double precision,
  payment_id text,
  contact_email text,
  contact_phone text,
  tracking_token text,
  additional_notes text,
  contact_preference text,
  preferred_artist text,
  purpose text,
  timeframe text,
  CONSTRAINT tattoo_requests_pkey PRIMARY KEY (id),
  CONSTRAINT tattoo_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT tattoo_requests_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL,
  password text,
  role text NOT NULL DEFAULT 'artist'::text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);