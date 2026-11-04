import jsPDF from "jspdf";

const fitText = ({
  pdf,
  value,
  maxWidth,
  maxFontSize,
  minFontSize,
  maxLines,
}) => {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(value, maxWidth);
    if (lines.length <= maxLines) return { fontSize, lines };
  }

  pdf.setFontSize(minFontSize);
  return {
    fontSize: minFontSize,
    lines: pdf.splitTextToSize(value, maxWidth),
  };
};

const formatDate = (value) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("The certificate has an invalid completion date.");
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const getSafeFileName = (studentName, certificateNumber) => {
  const safeName = Array.from(studentName.normalize("NFKD"))
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint >= 32 &&
        codePoint !== 127 &&
        !/[<>:"/\\|?*]/.test(character)
      );
    })
    .join("")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const safeNumber = certificateNumber.replace(/[^a-zA-Z0-9-]/g, "");

  return `KAINDRA-Certificate-${safeName || "Student"}-${safeNumber}.pdf`;
};

export const downloadAcademyCertificatePdf = (certificate) => {
  const studentName = certificate?.studentName?.trim();
  const courseTitle = certificate?.courseTitle?.trim();
  const certificateNumber = certificate?.certificateNumber?.trim();
  if (!studentName || !courseTitle || !certificateNumber) {
    throw new Error("The server returned incomplete certificate details.");
  }

  const completionDate = formatDate(certificate.completedAt);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const textWidth = pageWidth - 54;

  pdf.setFillColor(248, 246, 240);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setDrawColor(169, 127, 68);
  pdf.setLineWidth(0.8);
  pdf.rect(9, 9, pageWidth - 18, pageHeight - 18);
  pdf.setDrawColor(216, 199, 166);
  pdf.setLineWidth(0.3);
  pdf.rect(13, 13, pageWidth - 26, pageHeight - 26);

  pdf.setTextColor(54, 45, 37);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("KAINDRA", centerX, 28, { align: "center" });
  pdf.setTextColor(145, 105, 55);
  pdf.setFontSize(8);
  pdf.text("MODA ACADEMY", centerX, 34, { align: "center" });

  pdf.setTextColor(54, 45, 37);
  pdf.setFontSize(21);
  pdf.text("CERTIFICATE OF COMPLETION", centerX, 50, {
    align: "center",
    charSpace: 1.1,
  });
  pdf.setTextColor(112, 102, 91);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", centerX, 65, {
    align: "center",
    charSpace: 0.6,
  });

  pdf.setFont("helvetica", "bold");
  const studentLayout = fitText({
    pdf,
    value: studentName,
    maxWidth: textWidth,
    maxFontSize: 30,
    minFontSize: 21,
    maxLines: 2,
  });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(studentLayout.fontSize);
  pdf.setTextColor(133, 82, 52);
  const studentTop = 79;
  pdf.text(studentLayout.lines, centerX, studentTop, {
    align: "center",
    lineHeightFactor: 1.08,
  });
  const studentBottom =
    studentTop + studentLayout.lines.length * studentLayout.fontSize * 0.36;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(112, 102, 91);
  const courseLabelY = studentBottom + 9;
  pdf.text("for successfully completing the course", centerX, courseLabelY, {
    align: "center",
  });

  pdf.setFont("helvetica", "bold");
  const courseLayout = fitText({
    pdf,
    value: courseTitle,
    maxWidth: textWidth,
    maxFontSize: 23,
    minFontSize: 14,
    maxLines: 4,
  });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(courseLayout.fontSize);
  pdf.setTextColor(54, 45, 37);
  const courseTop = courseLabelY + 13;
  pdf.text(courseLayout.lines, centerX, courseTop, {
    align: "center",
    lineHeightFactor: 1.1,
  });
  const courseBottom =
    courseTop + courseLayout.lines.length * courseLayout.fontSize * 0.36;

  const detailsY = Math.min(courseBottom + 12, 176);
  pdf.setDrawColor(216, 199, 166);
  pdf.setLineWidth(0.4);
  pdf.line(centerX - 36, detailsY - 5, centerX + 36, detailsY - 5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(83, 75, 66);
  pdf.text(`Completed on ${completionDate}`, centerX, detailsY, {
    align: "center",
  });

  pdf.setFontSize(8);
  pdf.setTextColor(130, 120, 108);
  pdf.text(`CERTIFICATE NO. ${certificateNumber}`, centerX, 190, {
    align: "center",
  });

  pdf.save(getSafeFileName(studentName, certificateNumber));
};
