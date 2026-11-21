-- Verified from the public schema in nl2sql_db (PostgreSQL 18.6).
-- This file contains the six application tables and their indexes.
-- Run against an empty database to create this schema; it does not alter an
-- existing installation or create/modify application data.

CREATE TABLE public.departments (
    department_id integer NOT NULL,
    department_name character varying(100) NOT NULL,
    location character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT departments_pkey PRIMARY KEY (department_id),
    CONSTRAINT departments_department_name_key UNIQUE (department_name)
);

CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150),
    city character varying(100),
    country character varying(100),
    registration_date date DEFAULT CURRENT_DATE,
    CONSTRAINT customers_pkey PRIMARY KEY (customer_id),
    CONSTRAINT customers_email_key UNIQUE (email)
);

CREATE TABLE public.products (
    product_id integer NOT NULL,
    product_name character varying(150) NOT NULL,
    category character varying(100),
    price numeric(12, 2) NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_pkey PRIMARY KEY (product_id),
    CONSTRAINT products_price_check CHECK (price >= 0::numeric),
    CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= 0)
);

CREATE TABLE public.employees (
    employee_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    job_title character varying(100),
    salary numeric(12, 2),
    hire_date date NOT NULL,
    department_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employees_pkey PRIMARY KEY (employee_id),
    CONSTRAINT employees_email_key UNIQUE (email),
    CONSTRAINT employees_salary_check CHECK (salary >= 0::numeric),
    CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id)
        REFERENCES public.departments(department_id)
);

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    customer_id integer NOT NULL,
    employee_id integer,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    total_amount numeric(12, 2) DEFAULT 0 NOT NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (order_id),
    CONSTRAINT orders_status_check CHECK (
        status::text = ANY (ARRAY[
            'Pending'::character varying,
            'Processing'::character varying,
            'Shipped'::character varying,
            'Delivered'::character varying,
            'Cancelled'::character varying
        ]::text[])
    ),
    CONSTRAINT orders_total_amount_check CHECK (total_amount >= 0::numeric),
    CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id)
        REFERENCES public.customers(customer_id),
    CONSTRAINT orders_employee_id_fkey FOREIGN KEY (employee_id)
        REFERENCES public.employees(employee_id)
);

CREATE TABLE public.order_items (
    order_item_id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id),
    CONSTRAINT order_items_order_id_product_id_key UNIQUE (order_id, product_id),
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT order_items_unit_price_check CHECK (unit_price >= 0::numeric),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id)
        REFERENCES public.orders(order_id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id)
        REFERENCES public.products(product_id)
);

CREATE INDEX idx_employees_department ON public.employees USING btree (department_id);
CREATE INDEX idx_order_items_product ON public.order_items USING btree (product_id);
CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_date ON public.orders USING btree (order_date);
CREATE INDEX idx_orders_employee ON public.orders USING btree (employee_id);
