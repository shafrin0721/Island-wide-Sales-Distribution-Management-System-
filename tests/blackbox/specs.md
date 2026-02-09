# Black Box Test Cases

Target: https://isdn-6291c.web.app (default)

## Member 1 — Delivery Scheduling & Tracking

| TC ID | Test Scenario            | Input                     | Expected Output           |
| ----- | ------------------------ | ------------------------- | ------------------------- |
| DT-01 | Generate delivery route  | Confirmed orders          | Optimised route generated |
| DT-02 | Assign delivery          | RDC assigns driver        | Delivery assigned         |
| DT-03 | View assigned deliveries | Driver logs in            | Delivery list displayed   |
| DT-04 | Start delivery           | Status = Out for Delivery | GPS tracking enabled      |
| DT-05 | Real-time tracking       | Customer views order      | Live location shown       |
| DT-06 | Update delivery status   | Delivered                 | Status updated            |
| DT-07 | Failed delivery          | Delivery failed           | Failure reason recorded   |
| DT-08 | Invalid delivery ID      | Incorrect ID              | Error message             |
| DT-09 | Multiple deliveries      | Multiple orders           | Correct routing           |
| DT-10 | Delivery delay           | Delay input               | Updated ETA shown         |

## Member 1 — Automated Billing & Payments

| TC ID | Test Scenario             | Input                  | Expected Output    |
| ----- | ------------------------- | ---------------------- | ------------------ |
| BP-01 | Generate invoice          | Order confirmed        | Invoice generated  |
| BP-02 | Email invoice             | Valid email            | Invoice emailed    |
| BP-03 | View invoice              | Customer opens invoice | Invoice displayed  |
| BP-04 | Online payment success    | Valid payment details  | Payment successful |
| BP-05 | Online payment failure    | Invalid details        | Error message      |
| BP-06 | Payment status update     | Payment success        | Order marked Paid  |
| BP-07 | Duplicate payment attempt | Same order             | Blocked            |
| BP-08 | Payment cancellation      | Cancel payment         | Order unpaid       |
| BP-09 | Refund process            | Refund request         | Refund completed   |
| BP-10 | Payment history           | View history           | Records displayed  |

## Member 1 — Management Dashboard & Reporting

| TC ID | Test Scenario        | Input             | Expected Output     |
| ----- | -------------------- | ----------------- | ------------------- |
| MR-01 | View sales report    | Select date range | Correct sales data  |
| MR-02 | Delivery performance | Select metric     | KPI displayed       |
| MR-03 | Stock turnover       | Select product    | Turnover shown      |
| MR-04 | Staff KPI            | Select staff      | Performance data    |
| MR-05 | Unauthorized access  | Non-admin         | Access denied       |
| MR-06 | Real-time updates    | New order         | Dashboard updated   |
| MR-07 | Export report        | Export request    | File downloaded     |
| MR-08 | Empty data range     | No data           | Informative message |

## Member 2 — Centralised Order Management Portal

| TC ID | Test Scenario        | Input              | Expected Output    |
| ----- | -------------------- | ------------------ | ------------------ |
| OM-01 | Browse products      | Open products page | Products displayed |
| OM-02 | View product details | Select product     | Details shown      |
| OM-03 | View promotions      | Open promotions    | Promotions shown   |
| OM-04 | Add to cart          | Product + qty      | Added to cart      |
| OM-05 | Update cart          | Change qty         | Cart updated       |
| OM-06 | Remove item          | Remove product     | Removed            |
| OM-07 | Place order          | Confirm order      | Order created      |
| OM-08 | Order confirmation   | Valid order        | Confirmation shown |
| OM-09 | Estimated delivery   | Order placed       | ETA displayed      |
| OM-10 | Empty cart           | Confirm            | Error shown        |
| OM-11 | Invalid quantity     | Qty = 0            | Validation error   |
| OM-12 | Session expiry       | Timeout            | Redirect to login  |

## Member 2 — Real-Time Inventory Synchronisation

| TC ID  | Test Scenario       | Input             | Expected Output     |
| ------ | ------------------- | ----------------- | ------------------- |
| INV-01 | Stock reduction     | Order placed      | Stock reduced       |
| INV-02 | Order cancellation  | Cancel order      | Stock restored      |
| INV-03 | Multi-RDC sync      | RDC A order       | Central update      |
| INV-04 | Concurrent orders   | Same product      | No mismatch         |
| INV-05 | Low stock alert     | Below threshold   | Alert triggered     |
| INV-06 | Inter-RDC transfer  | Transfer approved | Both stocks updated |
| INV-07 | Transfer rejected   | Reject transfer   | No change           |
| INV-08 | Invalid product     | Wrong ID          | Error shown         |
| INV-09 | Manual stock update | Staff update      | Stock updated       |
| INV-10 | Out-of-stock        | Stock = 0         | Order blocked       |
| INV-11 | Refresh inventory   | Reload page       | Updated data        |
| INV-12 | Data consistency    | Multiple updates  | Accurate stock      |

## Member 2 — Role-Based Access Control (RBAC)

| TC ID   | Test Scenario      | Input              | Expected Output     |
| ------- | ------------------ | ------------------ | ------------------- |
| RBAC-01 | Customer login     | Valid credentials  | Customer dashboard  |
| RBAC-02 | RDC staff login    | Valid credentials  | Staff dashboard     |
| RBAC-03 | Admin login        | Valid credentials  | Admin dashboard     |
| RBAC-04 | Invalid login      | Wrong password     | Error shown         |
| RBAC-05 | Account lock       | Multiple failures  | Account locked      |
| RBAC-06 | Encrypted login    | Login request      | Secure login        |
| RBAC-07 | Unauthorized page  | Customer → Admin   | Access denied       |
| RBAC-08 | Restricted reports | Staff access       | Denied              |
| RBAC-09 | Admin access       | Admin reports      | Access allowed      |
| RBAC-10 | Session timeout    | Inactive           | Auto logout         |
| RBAC-11 | Logout             | Logout click       | Session ended       |
| RBAC-12 | Direct URL access  | Unauthorized URL   | Blocked             |
| RBAC-13 | Role update        | Admin changes role | Permissions updated |
| RBAC-14 | Data isolation     | Customer view      | Own data only       |
