type VerifyPaymentResponse = {
  paid?: boolean;
  transaction_status?: string;
  message?: string;
};

export async function verifyMidtransPayment(
  projectId: string | number,
  orderId: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(
      `/api/projects/${projectId}/pay/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      },
    );
    const result = (await response.json()) as VerifyPaymentResponse;

    if (!response.ok) {
      throw new Error(result.message || "Gagal memverifikasi pembayaran.");
    }
    if (result.paid) {
      return true;
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return false;
}
