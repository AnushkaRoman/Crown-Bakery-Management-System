
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  RefreshCw,
  IndianRupee,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Download,
  TrendingUp,
  BarChart3,
  CalendarDays,
  CakeSlice
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./admin-reports.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

export default function AdminReports() {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("crumbco-token");

  const loadReport = useCallback(async () => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = { period };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${API}/reports`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReport(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load sales reports."
      );
    } finally {
      setLoading(false);
    }
  }, [token, navigate, period, startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPeriod("daily");
  };

  const downloadCSV = () => {
    if (!report) return;

    const rows = [
      ["CRUMB & CO. - SALES REPORT"],
      ["Report Period", period],
      ["Start Date", startDate || "All"],
      ["End Date", endDate || "All"],
      [],
      ["SALES SUMMARY"],
      ["Total Revenue", report.summary.totalRevenue],
      ["Paid Orders", report.summary.paidOrders],
      ["Average Order Value", report.summary.averageOrderValue],
      ["Total Orders", report.summary.totalOrders],
      ["Completed Orders", report.summary.completedOrders],
      ["Cancelled Orders", report.summary.cancelledOrders],
      [],
      ["SALES TREND"],
      ["Date", "Revenue", "Orders"],
      ...(report.salesTrend || []).map((item) => [
        formatDate(item.date),
        item.revenue,
        item.orders
      ]),
      [],
      ["TOP SELLING PRODUCTS"],
      ["Product", "Quantity Sold", "Revenue"],
      ...(report.topProducts || []).map((item) => [
        item.productName,
        item.quantitySold,
        item.revenue
      ]),
      [],
      ["ORDER STATUS"],
      ["Status", "Count"],
      ...(report.statusBreakdown || []).map((item) => [
        item._id,
        item.count
      ])
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) =>
          `"${String(cell ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "crumb-co-sales-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const summary = report?.summary || {};
  const trend = report?.salesTrend || [];
  const maxRevenue = Math.max(
    ...trend.map((item) => item.revenue || 0),
    1
  );

  const cards = [
    {
      title: "Total Revenue",
      value: formatMoney(summary.totalRevenue),
      icon: IndianRupee,
      description: "Revenue from paid orders"
    },
    {
      title: "Total Orders",
      value: summary.totalOrders ?? 0,
      icon: ShoppingBag,
      description: "All orders received"
    },
    {
      title: "Completed Orders",
      value: summary.completedOrders ?? 0,
      icon: CheckCircle,
      description: "Successfully delivered"
    },
    {
      title: "Cancelled Orders",
      value: summary.cancelledOrders ?? 0,
      icon: XCircle,
      description: "Cancelled orders"
    }
  ];

  return (
    <div className="reports-page">
      <header className="reports-header">
        <Link to="/admin/dashboard" className="reports-brand">
          <span className="reports-brand-icon">
            <CakeSlice size={23} />
          </span>
          <span>
            crumb<span>&</span>co.
            <small>BAKERY · PATISSERIE</small>
          </span>
        </Link>

        <Link to="/admin/dashboard" className="reports-back">
          <ArrowLeft size={17} />
          Admin Dashboard
        </Link>
      </header>

      <main className="reports-main">
        <div className="reports-heading">
          <div>
            <span className="reports-eyebrow">
              ADMINISTRATION / ANALYTICS
            </span>
            <h1>Sales Reports</h1>
            <p>
              Track your bakery's revenue, orders and product
              performance.
            </p>
          </div>

          <button
            className="reports-refresh"
            onClick={loadReport}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <section className="reports-filters">
          <div className="report-filter">
            <label>Report period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="report-filter">
            <label>Start date</label>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="report-filter">
            <label>End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            className="reports-apply"
            onClick={loadReport}
            disabled={loading || (startDate && endDate && startDate > endDate)}
          >
            Apply Filters
          </button>

          <button
            className="reports-clear"
            onClick={clearFilters}
          >
            Clear
          </button>
        </section>

        {error && (
          <div className="reports-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="reports-loading">
            <RefreshCw className="reports-spinner" size={25} />
            Loading sales reports...
          </div>
        ) : report ? (
          <>
            <section className="reports-summary">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <article className="report-stat" key={card.title}>
                    <div className="report-stat-top">
                      <span>{card.title}</span>
                      <Icon size={21} />
                    </div>
                    <strong>{card.value}</strong>
                    <small>{card.description}</small>
                  </article>
                );
              })}
            </section>

            <section className="reports-extra-stats">
              <article>
                <span>Paid Orders</span>
                <strong>{summary.paidOrders ?? 0}</strong>
              </article>
              <article>
                <span>Average Order Value</span>
                <strong>
                  {formatMoney(summary.averageOrderValue)}
                </strong>
              </article>
            </section>

            <section className="reports-panel">
              <div className="reports-panel-heading">
                <div>
                  <h2>
                    <TrendingUp size={20} />
                    Sales Trend
                  </h2>
                  <p>Revenue from paid orders over time</p>
                </div>
              </div>

              {trend.length === 0 ? (
                <p className="reports-empty">
                  No paid sales available for this period.
                </p>
              ) : (
                <div className="sales-chart">
                  {trend.map((item, index) => (
                    <div className="sales-chart-column" key={`${item.date}-${index}`}>
                      <strong>{formatMoney(item.revenue)}</strong>
                      <div className="sales-bar-track">
                        <div
                          className="sales-bar"
                          style={{
                            height: `${Math.max(
                              (item.revenue / maxRevenue) * 100,
                              3
                            )}%`
                          }}
                        />
                      </div>
                      <span>{formatDate(item.date)}</span>
                      <small>{item.orders} orders</small>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="reports-two-columns">
              <section className="reports-panel">
                <h2>
                  <CakeSlice size={20} />
                  Top Selling Products
                </h2>

                {report.topProducts?.length ? (
                  <div className="reports-table-wrap">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty Sold</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.topProducts.map((product, index) => (
                          <tr key={`${product.productName}-${index}`}>
                            <td>{product.productName}</td>
                            <td>{product.quantitySold}</td>
                            <td>{formatMoney(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="reports-empty">
                    No product sales found.
                  </p>
                )}
              </section>

              <section className="reports-panel">
                <h2>
                  <BarChart3 size={20} />
                  Order Status
                </h2>

                {report.statusBreakdown?.length ? (
                  <div className="status-list">
                    {report.statusBreakdown.map((item) => (
                      <div className="status-row" key={item._id}>
                        <span>{item._id.replaceAll("_", " ")}</span>
                        <strong>{item.count}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="reports-empty">
                    No orders found.
                  </p>
                )}
              </section>
            </div>

            <div className="reports-download-row">
              <span>
                <CalendarDays size={17} />
                Report generated from your bakery orders
              </span>

              <button
                className="reports-download"
                onClick={downloadCSV}
              >
                <Download size={17} />
                Download CSV
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
