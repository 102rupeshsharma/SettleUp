import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import PDFDocument from 'pdfkit';

export const exportCSV = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ groupId: req.group._id })
      .populate('paidBy', 'name email')
      .sort({ createdAt: -1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="group_expenses.csv"');

    let csvContent = 'Description,Amount,Category,Paid By,Email,Date\n';
    expenses.forEach((e) => {
      const desc = `"${e.description.replace(/"/g, '""')}"`;
      const date = new Date(e.createdAt).toLocaleDateString();
      csvContent += `${desc},${e.amount},${e.category},"${e.paidBy?.name || 'Unknown'}","${e.paidBy?.email || ''}",${date}\n`;
    });

    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportPDF = async (req, res, next) => {
  try {
    const group = await req.group.populate('members.userId', 'name email');
    const expenses = await Expense.find({ groupId: group._id }).populate('paidBy', 'name');
    const settlements = await Settlement.find({ groupId: group._id })
      .populate('fromUser', 'name')
      .populate('toUser', 'name');

    const nets = {};
    group.members.forEach((m) => {
      nets[m.userId._id.toString()] = 0;
    });

    expenses.forEach((expense) => {
      const payer = expense.paidBy._id.toString();
      if (nets[payer] !== undefined) nets[payer] += expense.amount;
      expense.splits.forEach((split) => {
        const splitUser = split.userId.toString();
        if (nets[splitUser] !== undefined) nets[splitUser] -= split.amount;
      });
    });

    settlements.forEach((settlement) => {
      const payer = settlement.fromUser._id.toString();
      const receiver = settlement.toUser._id.toString();
      if (nets[payer] !== undefined) nets[payer] += settlement.amount;
      if (nets[receiver] !== undefined) nets[receiver] -= settlement.amount;
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${group.name}_summary.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).text('SettleUp - Group Financial Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Group: ${group.name}`, { align: 'center' });
    doc.fontSize(10).text(group.description || '', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Current Member Balances', { underline: true });
    doc.moveDown(0.5);
    group.members.forEach((m) => {
      const uId = m.userId._id.toString();
      const net = nets[uId] || 0;
      let balanceStr = 'Fully Settled';
      if (net > 0.01) {
        balanceStr = `Owed $${net.toFixed(2)}`;
      } else if (net < -0.01) {
        balanceStr = `Owes $${Math.abs(net).toFixed(2)}`;
      }
      doc.fontSize(12).text(`${m.userId.name}: ${balanceStr}`);
    });
    doc.moveDown(2);

    doc.fontSize(16).text('Recent Expenses Log', { underline: true });
    doc.moveDown(0.5);
    if (expenses.length === 0) {
      doc.fontSize(11).text('No expenses recorded.');
    } else {
      expenses.forEach((e) => {
        doc.fontSize(11).text(
          `${new Date(e.createdAt).toLocaleDateString()} - ${e.description}: $${e.amount.toFixed(2)} (Paid by ${e.paidBy?.name})`
        );
      });
    }
    doc.moveDown(2);

    doc.fontSize(16).text('Recent Settlements Log', { underline: true });
    doc.moveDown(0.5);
    if (settlements.length === 0) {
      doc.fontSize(11).text('No settlements recorded.');
    } else {
      settlements.forEach((s) => {
        doc.fontSize(11).text(
          `${new Date(s.settledAt).toLocaleDateString()} - ${s.fromUser?.name} paid ${s.toUser?.name} $${s.amount.toFixed(2)} via ${s.method}`
        );
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};
