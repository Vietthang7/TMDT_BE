import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('mail.email'),
        pass: this.configService.get<string>('mail.password'),
      },
    });
  }

  async sendOrderConfirmation(email: string, order: Order): Promise<void> {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${item.product?.name || 'Sản phẩm'}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${Number(item.priceAtPurchase).toLocaleString('vi-VN')}đ
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${(Number(item.priceAtPurchase) * item.quantity).toLocaleString('vi-VN')}đ
          </td>
        </tr>`,
      )
      .join('');

    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.priceAtPurchase) * item.quantity,
      0,
    );

    const discountHtml =
      Number(order.discountAmount) > 0
        ? `
        <tr>
          <td colspan="3" style="padding: 8px 12px; text-align: right; color: #e53e3e;">Giảm giá${order.couponCode ? ` (${order.couponCode})` : ''}:</td>
          <td style="padding: 8px 12px; text-align: right; color: #e53e3e; font-weight: bold;">-${Number(order.discountAmount).toLocaleString('vi-VN')}đ</td>
        </tr>`
        : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">🏋️ Fitness Store</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Xác nhận đơn hàng</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333;">Xin chào,</p>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Cảm ơn bạn đã đặt hàng tại <strong>Fitness Store</strong>! Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
          </p>

          <!-- Order Info -->
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px; color: #555;">
              <tr>
                <td style="padding: 4px 0;"><strong>Mã đơn hàng:</strong></td>
                <td style="text-align: right; color: #667eea; font-weight: bold;">${order.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Ngày đặt:</strong></td>
                <td style="text-align: right;">${new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Địa chỉ giao:</strong></td>
                <td style="text-align: right;">${order.shippingAddress || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Products Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; color: #555; border-bottom: 2px solid #eee;">Sản phẩm</th>
                <th style="padding: 12px; text-align: center; color: #555; border-bottom: 2px solid #eee;">SL</th>
                <th style="padding: 12px; text-align: right; color: #555; border-bottom: 2px solid #eee;">Đơn giá</th>
                <th style="padding: 12px; text-align: right; color: #555; border-bottom: 2px solid #eee;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px 12px; text-align: right; color: #555;">Tạm tính:</td>
                <td style="padding: 8px 12px; text-align: right;">${subtotal.toLocaleString('vi-VN')}đ</td>
              </tr>
              ${discountHtml}
              <tr style="border-top: 2px solid #667eea;">
                <td colspan="3" style="padding: 12px; text-align: right; font-size: 16px;"><strong>Tổng cộng:</strong></td>
                <td style="padding: 12px; text-align: right; font-size: 18px; color: #667eea; font-weight: bold;">${Number(order.totalAmount).toLocaleString('vi-VN')}đ</td>
              </tr>
            </tfoot>
          </table>

          <p style="font-size: 14px; color: #888; line-height: 1.6; margin-top: 24px;">
            Chúng tôi sẽ thông báo khi đơn hàng được giao đến bạn. Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 13px; color: #999;">© 2025 Fitness Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

    try {
      await this.transporter.sendMail({
        from: `"Fitness Store" <${this.configService.get<string>('mail.email')}>`,
        to: email,
        subject: `🛒 Xác nhận đơn hàng #${order.id.slice(0, 8).toUpperCase()}`,
        html,
      });
      this.logger.log(`Order confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
    }
  }
}
