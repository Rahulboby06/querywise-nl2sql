~~-- Deterministic fictional Indian company seed data for the supplied schema.
-- Run once against a fresh, empty database. Do not rerun without resetting the
-- data: this script uses fixed primary-key and unique email values.
-- Amounts are INR numeric values without currency symbols.

BEGIN;

INSERT INTO departments (department_id, department_name, location, created_at)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Engineering', 'Bengaluru', TIMESTAMP '2026-03-01 09:00:00'),
    (2, 'Sales', 'Mumbai', TIMESTAMP '2026-03-01 09:00:00'),
    (3, 'Customer Success', 'Pune', TIMESTAMP '2026-03-01 09:00:00'),
    (4, 'Finance', 'Delhi', TIMESTAMP '2026-03-01 09:00:00'),
    (5, 'Operations', 'Hyderabad', TIMESTAMP '2026-03-01 09:00:00'),
    (6, 'Marketing', 'Chennai', TIMESTAMP '2026-03-01 09:00:00'),
    (7, 'Human Resources', 'Jaipur', TIMESTAMP '2026-03-01 09:00:00'),
    (8, 'Procurement', 'Kolkata', TIMESTAMP '2026-03-01 09:00:00');

INSERT INTO employees (
    employee_id, first_name, last_name, email, job_title, salary, hire_date,
    department_id, created_at
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Aarav', 'Sharma', 'aarav.sharma01@example.com', 'Engineering Manager', 185000.00, DATE '2020-04-13', 1, TIMESTAMP '2026-03-01 09:00:00'),
    (2, 'Ananya', 'Iyer', 'ananya.iyer02@example.com', 'Senior Software Engineer', 142000.00, DATE '2021-08-02', 1, TIMESTAMP '2026-03-01 09:00:00'),
    (3, 'Rohan', 'Mehta', 'rohan.mehta03@example.com', 'Data Engineer', 128500.00, DATE '2022-01-17', 1, TIMESTAMP '2026-03-01 09:00:00'),
    (4, 'Ishita', 'Rao', 'ishita.rao04@example.com', 'Quality Assurance Engineer', 96500.00, DATE '2023-06-05', 1, TIMESTAMP '2026-03-01 09:00:00'),
    (5, 'Kabir', 'Nair', 'kabir.nair05@example.com', 'Sales Manager', 168000.00, DATE '2019-11-11', 2, TIMESTAMP '2026-03-01 09:00:00'),
    (6, 'Diya', 'Kapoor', 'diya.kapoor06@example.com', 'Enterprise Account Executive', 112000.00, DATE '2021-02-22', 2, TIMESTAMP '2026-03-01 09:00:00'),
    (7, 'Vivaan', 'Reddy', 'vivaan.reddy07@example.com', 'Account Executive', 89500.00, DATE '2022-09-12', 2, TIMESTAMP '2026-03-01 09:00:00'),
    (8, 'Meera', 'Patel', 'meera.patel08@example.com', 'Sales Operations Analyst', 78000.00, DATE '2024-01-08', 2, TIMESTAMP '2026-03-01 09:00:00'),
    (9, 'Arjun', 'Menon', 'arjun.menon09@example.com', 'Customer Success Manager', 135000.00, DATE '2020-07-20', 3, TIMESTAMP '2026-03-01 09:00:00'),
    (10, 'Saanvi', 'Desai', 'saanvi.desai10@example.com', 'Customer Success Specialist', 82500.00, DATE '2022-03-14', 3, TIMESTAMP '2026-03-01 09:00:00'),
    (11, 'Aditya', 'Kulkarni', 'aditya.kulkarni11@example.com', 'Implementation Consultant', 94000.00, DATE '2023-10-02', 3, TIMESTAMP '2026-03-01 09:00:00'),
    (12, 'Tara', 'Chopra', 'tara.chopra12@example.com', 'Support Team Lead', 108000.00, DATE '2021-05-24', 3, TIMESTAMP '2026-03-01 09:00:00'),
    (13, 'Rahul', 'Bose', 'rahul.bose13@example.com', 'Finance Manager', 172000.00, DATE '2018-12-03', 4, TIMESTAMP '2026-03-01 09:00:00'),
    (14, 'Kavya', 'Pillai', 'kavya.pillai14@example.com', 'Senior Accountant', 98500.00, DATE '2020-09-28', 4, TIMESTAMP '2026-03-01 09:00:00'),
    (15, 'Ishaan', 'Gupta', 'ishaan.gupta15@example.com', 'Financial Analyst', 87500.00, DATE '2022-11-07', 4, TIMESTAMP '2026-03-01 09:00:00'),
    (16, 'Nisha', 'Khan', 'nisha.khan16@example.com', 'Accounts Payable Executive', 62500.00, DATE '2024-04-15', 4, TIMESTAMP '2026-03-01 09:00:00'),
    (17, 'Dev', 'Srinivasan', 'dev.srinivasan17@example.com', 'Operations Manager', 158000.00, DATE '2019-06-10', 5, TIMESTAMP '2026-03-01 09:00:00'),
    (18, 'Pooja', 'Verma', 'pooja.verma18@example.com', 'Supply Chain Analyst', 92500.00, DATE '2021-12-06', 5, TIMESTAMP '2026-03-01 09:00:00'),
    (19, 'Karan', 'Joshi', 'karan.joshi19@example.com', 'Logistics Coordinator', 73500.00, DATE '2023-02-13', 5, TIMESTAMP '2026-03-01 09:00:00'),
    (20, 'Aditi', 'Mishra', 'aditi.mishra20@example.com', 'Warehouse Supervisor', 81500.00, DATE '2022-06-27', 5, TIMESTAMP '2026-03-01 09:00:00'),
    (21, 'Neil', 'Fernandes', 'neil.fernandes21@example.com', 'Marketing Manager', 162000.00, DATE '2019-03-18', 6, TIMESTAMP '2026-03-01 09:00:00'),
    (22, 'Riya', 'Chatterjee', 'riya.chatterjee22@example.com', 'Content Strategist', 97500.00, DATE '2021-10-04', 6, TIMESTAMP '2026-03-01 09:00:00'),
    (23, 'Siddharth', 'Das', 'siddharth.das23@example.com', 'Digital Marketing Specialist', 84500.00, DATE '2023-04-24', 6, TIMESTAMP '2026-03-01 09:00:00'),
    (24, 'Mira', 'Shetty', 'mira.shetty24@example.com', 'Brand Designer', 91500.00, DATE '2022-08-16', 6, TIMESTAMP '2026-03-01 09:00:00'),
    (25, 'Samar', 'Bhatia', 'samar.bhatia25@example.com', 'Human Resources Manager', 148000.00, DATE '2020-02-10', 7, TIMESTAMP '2026-03-01 09:00:00'),
    (26, 'Tanvi', 'Ghosh', 'tanvi.ghosh26@example.com', 'Talent Acquisition Partner', 88500.00, DATE '2021-07-19', 7, TIMESTAMP '2026-03-01 09:00:00'),
    (27, 'Yash', 'Agarwal', 'yash.agarwal27@example.com', 'People Operations Executive', 69500.00, DATE '2024-02-05', 7, TIMESTAMP '2026-03-01 09:00:00'),
    (28, 'Leela', 'Mukherjee', 'leela.mukherjee28@example.com', 'Procurement Manager', 139000.00, DATE '2019-09-09', 8, TIMESTAMP '2026-03-01 09:00:00'),
    (29, 'Manav', 'Krishnan', 'manav.krishnan29@example.com', 'Strategic Sourcing Specialist', 102000.00, DATE '2021-04-12', 8, TIMESTAMP '2026-03-01 09:00:00'),
    (30, 'Zoya', 'Dutta', 'zoya.dutta30@example.com', 'Procurement Coordinator', 71500.00, DATE '2023-12-11', 8, TIMESTAMP '2026-03-01 09:00:00');

INSERT INTO customers (
    customer_id, first_name, last_name, email, city, country, registration_date
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Vikram', 'Singh', 'vikram.singh01@example.com', 'Delhi', 'India', DATE '2022-01-14'),
    (2, 'Sneha', 'Nair', 'sneha.nair02@example.com', 'Mumbai', 'India', DATE '2022-02-08'),
    (3, 'Harsh', 'Patel', 'harsh.patel03@example.com', 'Bengaluru', 'India', DATE '2022-03-21'),
    (4, 'Manya', 'Reddy', 'manya.reddy04@example.com', 'Hyderabad', 'India', DATE '2022-04-05'),
    (5, 'Omkar', 'Deshmukh', 'omkar.deshmukh05@example.com', 'Pune', 'India', DATE '2022-05-17'),
    (6, 'Ayesha', 'Thomas', 'ayesha.thomas06@example.com', 'Chennai', 'India', DATE '2022-06-02'),
    (7, 'Pranav', 'Shah', 'pranav.shah07@example.com', 'Jaipur', 'India', DATE '2022-07-19'),
    (8, 'Ira', 'Banerjee', 'ira.banerjee08@example.com', 'Kolkata', 'India', DATE '2022-08-11'),
    (9, 'Sahil', 'Malhotra', 'sahil.malhotra09@example.com', 'Ahmedabad', 'India', DATE '2022-09-26'),
    (10, 'Kriti', 'Rao', 'kriti.rao10@example.com', 'Kochi', 'India', DATE '2022-10-07'),
    (11, 'Nikhil', 'Bansal', 'nikhil.bansal11@example.com', 'Delhi', 'India', DATE '2022-11-15'),
    (12, 'Lavanya', 'Iyer', 'lavanya.iyer12@example.com', 'Mumbai', 'India', DATE '2022-12-03'),
    (13, 'Ritesh', 'Kulkarni', 'ritesh.kulkarni13@example.com', 'Bengaluru', 'India', DATE '2023-01-22'),
    (14, 'Simran', 'Kaur', 'simran.kaur14@example.com', 'Hyderabad', 'India', DATE '2023-02-09'),
    (15, 'Aman', 'Chauhan', 'aman.chauhan15@example.com', 'Pune', 'India', DATE '2023-03-13'),
    (16, 'Bhavna', 'Menon', 'bhavna.menon16@example.com', 'Chennai', 'India', DATE '2023-04-28'),
    (17, 'Gaurav', 'Saxena', 'gaurav.saxena17@example.com', 'Jaipur', 'India', DATE '2023-05-06'),
    (18, 'Roshni', 'Dey', 'roshni.dey18@example.com', 'Kolkata', 'India', DATE '2023-06-20'),
    (19, 'Parth', 'Mehta', 'parth.mehta19@example.com', 'Surat', 'India', DATE '2023-07-12'),
    (20, 'Anika', 'Pillai', 'anika.pillai20@example.com', 'Indore', 'India', DATE '2023-08-24'),
    (21, 'Suresh', 'Naidu', 'suresh.naidu21@example.com', 'Delhi', 'India', DATE '2023-09-04'),
    (22, 'Kavita', 'Joshi', 'kavita.joshi22@example.com', 'Mumbai', 'India', DATE '2023-10-16'),
    (23, 'Raghav', 'Bhat', 'raghav.bhat23@example.com', 'Bengaluru', 'India', DATE '2023-11-29'),
    (24, 'Nandini', 'Raman', 'nandini.raman24@example.com', 'Hyderabad', 'India', DATE '2023-12-08'),
    (25, 'Deepak', 'Yadav', 'deepak.yadav25@example.com', 'Pune', 'India', DATE '2024-01-18'),
    (26, 'Mitali', 'Sengupta', 'mitali.sengupta26@example.com', 'Chennai', 'India', DATE '2024-02-27'),
    (27, 'Kunal', 'Arora', 'kunal.arora27@example.com', 'Jaipur', 'India', DATE '2024-03-11'),
    (28, 'Pallavi', 'Mitra', 'pallavi.mitra28@example.com', 'Kolkata', 'India', DATE '2024-04-23'),
    (29, 'Rohan', 'Shetty', 'rohan.shetty29@example.com', 'Nagpur', 'India', DATE '2024-05-09'),
    (30, 'Sakshi', 'Dubey', 'sakshi.dubey30@example.com', 'Lucknow', 'India', DATE '2024-06-14'),
    (31, 'Abhishek', 'Jain', 'abhishek.jain31@example.com', 'Delhi', 'India', DATE '2024-07-02'),
    (32, 'Sonal', 'Bhattacharya', 'sonal.bhattacharya32@example.com', 'Mumbai', 'India', DATE '2024-08-19'),
    (33, 'Chirag', 'Parekh', 'chirag.parekh33@example.com', 'Bengaluru', 'India', DATE '2024-09-05'),
    (34, 'Esha', 'Krishnan', 'esha.krishnan34@example.com', 'Hyderabad', 'India', DATE '2024-10-22'),
    (35, 'Mohan', 'Rao', 'mohan.rao35@example.com', 'Pune', 'India', DATE '2024-11-07'),
    (36, 'Tanya', 'Gill', 'tanya.gill36@example.com', 'Chennai', 'India', DATE '2024-12-16'),
    (37, 'Ajay', 'Nanda', 'ajay.nanda37@example.com', 'Jaipur', 'India', DATE '2025-01-09'),
    (38, 'Farah', 'Qureshi', 'farah.qureshi38@example.com', 'Kolkata', 'India', DATE '2025-02-18'),
    (39, 'Tarun', 'Mishra', 'tarun.mishra39@example.com', 'Bhopal', 'India', DATE '2025-03-03'),
    (40, 'Ishani', 'Roy', 'ishani.roy40@example.com', 'Coimbatore', 'India', DATE '2025-04-21'),
    (41, 'Sanjay', 'Kapoor', 'sanjay.kapoor41@example.com', 'Delhi', 'India', DATE '2025-05-12'),
    (42, 'Rekha', 'Pawar', 'rekha.pawar42@example.com', 'Mumbai', 'India', DATE '2025-06-06'),
    (43, 'Varun', 'Nambiar', 'varun.nambiar43@example.com', 'Bengaluru', 'India', DATE '2025-07-24'),
    (44, 'Charu', 'Sethi', 'charu.sethi44@example.com', 'Hyderabad', 'India', DATE '2025-08-15'),
    (45, 'Madhav', 'Tiwari', 'madhav.tiwari45@example.com', 'Pune', 'India', DATE '2025-09-02'),
    (46, 'Leena', 'Fernandes', 'leena.fernandes46@example.com', 'Chennai', 'India', DATE '2025-10-13'),
    (47, 'Dinesh', 'Garg', 'dinesh.garg47@example.com', 'Jaipur', 'India', DATE '2025-11-05'),
    (48, 'Amrita', 'Bose', 'amrita.bose48@example.com', 'Kolkata', 'India', DATE '2025-12-17'),
    (49, 'Jayant', 'Sinha', 'jayant.sinha49@example.com', 'Visakhapatnam', 'India', DATE '2026-01-26'),
    (50, 'Suhani', 'Gokhale', 'suhani.gokhale50@example.com', 'Mysuru', 'India', DATE '2026-02-11');

INSERT INTO products (
    product_id, product_name, category, price, stock_quantity, created_at
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Aarohan Business Laptop', 'Electronics', 68990.00, 42, TIMESTAMP '2026-03-01 09:00:00'),
    (2, 'Saraswati Wireless Keyboard', 'Electronics', 2499.00, 115, TIMESTAMP '2026-03-01 09:00:00'),
    (3, 'Nimbus Noise-Cancelling Headphones', 'Electronics', 7990.00, 68, TIMESTAMP '2026-03-01 09:00:00'),
    (4, 'Lotus USB-C Dock', 'Electronics', 6490.00, 54, TIMESTAMP '2026-03-01 09:00:00'),
    (5, 'Peacock 27-inch Monitor', 'Electronics', 18990.00, 31, TIMESTAMP '2026-03-01 09:00:00'),
    (6, 'Indigo Ergonomic Chair', 'Furniture', 12450.00, 27, TIMESTAMP '2026-03-01 09:00:00'),
    (7, 'Neem Standing Desk', 'Furniture', 22900.00, 18, TIMESTAMP '2026-03-01 09:00:00'),
    (8, 'Mango Wood Bookshelf', 'Furniture', 8750.00, 22, TIMESTAMP '2026-03-01 09:00:00'),
    (9, 'Kaveri Desk Lamp', 'Office Supplies', 1890.00, 76, TIMESTAMP '2026-03-01 09:00:00'),
    (10, 'Monsoon A4 Paper Pack', 'Office Supplies', 425.00, 240, TIMESTAMP '2026-03-01 09:00:00'),
    (11, 'Chai Ceramic Mug Set', 'Kitchen', 1290.00, 95, TIMESTAMP '2026-03-01 09:00:00'),
    (12, 'Coconut Steel Water Bottle', 'Kitchen', 875.00, 132, TIMESTAMP '2026-03-01 09:00:00'),
    (13, 'Saffron Cotton Notebook Set', 'Office Supplies', 560.00, 180, TIMESTAMP '2026-03-01 09:00:00'),
    (14, 'Banyan Executive Backpack', 'Accessories', 3290.00, 49, TIMESTAMP '2026-03-01 09:00:00'),
    (15, 'Ganga Laser Printer', 'Electronics', 15990.00, 24, TIMESTAMP '2026-03-01 09:00:00'),
    (16, 'Malabar Conference Speaker', 'Electronics', 5490.00, 36, TIMESTAMP '2026-03-01 09:00:00'),
    (17, 'Thar Portable Projector', 'Electronics', 27900.00, 12, TIMESTAMP '2026-03-01 09:00:00'),
    (18, 'Darjeeling Tea Sampler', 'Pantry', 1150.00, 88, TIMESTAMP '2026-03-01 09:00:00'),
    (19, 'Konkan Desk Organizer', 'Office Supplies', 980.00, 64, TIMESTAMP '2026-03-01 09:00:00'),
    (20, 'Nilgiri Webcam', 'Electronics', 3990.00, 57, TIMESTAMP '2026-03-01 09:00:00'),
    (21, 'Udaan Travel Adapter', 'Accessories', 1490.00, 102, TIMESTAMP '2026-03-01 09:00:00'),
    (22, 'Mysore Sandalwood Hand Wash', 'Pantry', 310.00, 145, TIMESTAMP '2026-03-01 09:00:00'),
    (23, 'Himalaya First-Aid Kit', 'Safety', 890.00, 73, TIMESTAMP '2026-03-01 09:00:00'),
    (24, 'Kashmir Merino Conference Scarf', 'Apparel', 2450.00, 29, TIMESTAMP '2026-03-01 09:00:00'),
    (25, 'Coromandel Whiteboard', 'Office Supplies', 3790.00, 33, TIMESTAMP '2026-03-01 09:00:00');

-- Orders begin with zero totals; totals are derived from the inserted line items.
INSERT INTO orders (
    order_id, customer_id, employee_id, order_date, status, total_amount
)
OVERRIDING SYSTEM VALUE
SELECT
    series.order_number,
    ((series.order_number - 1) % 50) + 1,
    ((series.order_number - 1) % 30) + 1,
    TIMESTAMP '2025-01-01 09:00:00'
        + ((series.order_number - 1) * INTERVAL '3 days')
        + ((series.order_number % 8) * INTERVAL '1 hour'),
    CASE ((series.order_number - 1) % 5)
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Processing'
        WHEN 2 THEN 'Shipped'
        WHEN 3 THEN 'Delivered'
        ELSE 'Cancelled'
    END,
    0.00
FROM generate_series(1, 100) AS series(order_number);

-- Two distinct products per order produce exactly 200 order items.
INSERT INTO order_items (
    order_item_id, order_id, product_id, quantity, unit_price
)
OVERRIDING SYSTEM VALUE
SELECT
    ((o.order_id - 1) * 2) + item_slot.slot_number,
    o.order_id,
    ((o.order_id + ((item_slot.slot_number - 1) * 7) - 1) % 25) + 1,
    1 + ((o.order_id + item_slot.slot_number) % 5),
    p.price
FROM orders AS o
CROSS JOIN (VALUES (1), (2)) AS item_slot(slot_number)
JOIN products AS p
    ON p.product_id = ((o.order_id + ((item_slot.slot_number - 1) * 7) - 1) % 25) + 1
WHERE o.order_id BETWEEN 1 AND 100;

UPDATE orders AS o
SET total_amount = item_totals.total_amount
FROM (
    SELECT order_id, SUM(quantity * unit_price)::NUMERIC(12, 2) AS total_amount
    FROM order_items
    WHERE order_id BETWEEN 1 AND 100
    GROUP BY order_id
) AS item_totals
WHERE o.order_id = item_totals.order_id;

-- Advance identity sequences beyond the explicit values inserted above.
SELECT setval(pg_get_serial_sequence('departments', 'department_id'), (SELECT MAX(department_id) FROM departments), true);
SELECT setval(pg_get_serial_sequence('employees', 'employee_id'), (SELECT MAX(employee_id) FROM employees), true);
SELECT setval(pg_get_serial_sequence('customers', 'customer_id'), (SELECT MAX(customer_id) FROM customers), true);
SELECT setval(pg_get_serial_sequence('products', 'product_id'), (SELECT MAX(product_id) FROM products), true);
SELECT setval(pg_get_serial_sequence('orders', 'order_id'), (SELECT MAX(order_id) FROM orders), true);
SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), (SELECT MAX(order_item_id) FROM order_items), true);

-- Fail the transaction if the deterministic seed no longer satisfies its invariants.
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM departments WHERE department_id BETWEEN 1 AND 8) <> 8 THEN
        RAISE EXCEPTION 'Seed validation failed: expected 8 departments';
    END IF;
    IF (SELECT COUNT(*) FROM employees WHERE employee_id BETWEEN 1 AND 30) <> 30 THEN
        RAISE EXCEPTION 'Seed validation failed: expected 30 employees';
    END IF;
    IF (SELECT COUNT(*) FROM customers WHERE customer_id BETWEEN 1 AND 50) <> 50 THEN
        RAISE EXCEPTION 'Seed validation failed: expected 50 customers';
    END IF;
    IF (SELECT COUNT(*) FROM products WHERE product_id BETWEEN 1 AND 25) <> 25 THEN
        RAISE EXCEPTION 'Seed validation failed: expected 25 products';
    END IF;
    IF (SELECT COUNT(*) FROM orders WHERE order_id BETWEEN 1 AND 100) <> 100 THEN
        RAISE EXCEPTION 'Seed validation failed: expected 100 orders';
    END IF;
    IF (SELECT COUNT(*) FROM order_items WHERE order_item_id BETWEEN 1 AND 200) <> 200 THEN
        RAISE EXCEPTION 'Seed validation failed: expected 200 order items';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM orders AS o
        LEFT JOIN (
            SELECT order_id, SUM(quantity * unit_price)::NUMERIC(12, 2) AS total_amount
            FROM order_items
            WHERE order_id BETWEEN 1 AND 100
            GROUP BY order_id
        ) AS item_totals ON item_totals.order_id = o.order_id
        WHERE o.order_id BETWEEN 1 AND 100
          AND (item_totals.total_amount IS NULL OR o.total_amount <> item_totals.total_amount)
    ) THEN
        RAISE EXCEPTION 'Seed validation failed: one or more order totals do not match their items';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM orders AS o
        LEFT JOIN order_items AS oi ON oi.order_id = o.order_id
        WHERE o.order_id BETWEEN 1 AND 100
        GROUP BY o.order_id
        HAVING COUNT(oi.order_item_id) <> 2
    ) THEN
        RAISE EXCEPTION 'Seed validation failed: each order must have exactly 2 items';
    END IF;
    IF (SELECT COUNT(DISTINCT status) FROM orders WHERE order_id BETWEEN 1 AND 100) <> 5 THEN
        RAISE EXCEPTION 'Seed validation failed: expected all five permitted order statuses';
    END IF;
END;
$$;

COMMIT;
