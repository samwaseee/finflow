// src/components/InvoicePDF.tsx

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 48,
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#2563EB",
  },
  invoiceLabel: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  // Status badge
  statusBadge: {
    marginTop: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 99,
    alignSelf: "flex-end",
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 28,
  },
  // From / To section
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  metaBlock: {
    width: "45%",
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  metaSub: {
    fontSize: 10,
    color: "#6B7280",
  },
  // Dates row
  datesRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 32,
  },
  dateBlock: {},
  dateLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 11,
    color: "#111827",
  },
  // Table
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  colDescription: { flex: 1 },
  colQty: { width: 50, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  thText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdText: {
    fontSize: 10,
    color: "#374151",
  },
  // Totals
  totalsBox: {
    alignItems: "flex-end",
    marginBottom: 32,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 10,
    color: "#374151",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2563EB",
    borderRadius: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  // Notes
  notesBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 12,
    marginBottom: 32,
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#9CA3AF",
  },
});

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT:   { bg: "#F3F4F6", text: "#6B7280" },
  SENT:    { bg: "#DBEAFE", text: "#1D4ED8" },
  PAID:    { bg: "#D1FAE5", text: "#065F46" },
  OVERDUE: { bg: "#FEE2E2", text: "#991B1B" },
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  invoice: {
    number: string;
    status: string;
    dueDate: string;
    createdAt: string;
    total: number;
    notes?: string | null;
    items: Item[];
    client: { name: string; email: string; address?: string | null };
  };
  orgName: string;
};

export default function InvoicePDF({ invoice, orgName }: Props) {
  const statusColor = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.DRAFT;

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{orgName}</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {invoice.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* From / To */}
        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>From</Text>
            <Text style={styles.metaValue}>{orgName}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Bill to</Text>
            <Text style={styles.metaValue}>{invoice.client.name}</Text>
            <Text style={styles.metaSub}>{invoice.client.email}</Text>
            {invoice.client.address && (
              <Text style={styles.metaSub}>{invoice.client.address}</Text>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Issue date</Text>
            <Text style={styles.dateValue}>
              {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Due date</Text>
            <Text style={styles.dateValue}>
              {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colDescription]}>Description</Text>
            <Text style={[styles.thText, styles.colQty]}>Qty</Text>
            <Text style={[styles.thText, styles.colPrice]}>Unit price</Text>
            <Text style={[styles.thText, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tdText, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tdText, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tdText, styles.colPrice]}>
                ${Number(item.unitPrice).toFixed(2)}
              </Text>
              <Text style={[styles.tdText, styles.colTotal]}>
                ${(item.quantity * item.unitPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total due</Text>
            <Text style={styles.grandTotalValue}>
              ${Number(invoice.total).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by FinFlow · Thank you for your business
          </Text>
        </View>

      </Page>
    </Document>
  );
}