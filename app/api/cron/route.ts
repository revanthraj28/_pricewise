// import { NextResponse } from "next/server";
// import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/lib/utils";
// import { connectToDB } from "@/lib/scraper/mongoose";
// import Product from "@/lib/models/product.model";
// import { scrapeAmazonProduct } from "@/lib/scraper";
// import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

// export const maxDuration = 60; // This function can run for a maximum of 60 seconds
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// export async function GET(request: Request) {
//   try {
//     connectToDB();

//     const products = await Product.find({});

//     if (!products || products.length === 0) {
//       throw new Error("No product fetched");
//     }

//     // ======================== 1 SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
//     const updatedProducts = await Promise.all(
//       products.map(async (currentProduct) => {
//         try {
//           // Scrape product
//           const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

//           if (!scrapedProduct || !scrapedProduct.currentPrice) {
//             console.error(`Failed to scrape product or currentPrice is missing for URL: ${currentProduct.url}`);
//             return null; // Skip this product if scraping failed or currentPrice is missing
//           }

//           const updatedPriceHistory = [
//             ...currentProduct.priceHistory,
//             {
//               price: scrapedProduct.currentPrice,
//               date: new Date(), // Add a date for the price entry
//             },
//           ];

//           const product = {
//             ...scrapedProduct,
//             priceHistory: updatedPriceHistory,
//             lowestPrice: getLowestPrice(updatedPriceHistory),
//             highestPrice: getHighestPrice(updatedPriceHistory),
//             averagePrice: getAveragePrice(updatedPriceHistory),
//           };

//           // Update Products in DB
//           const updatedProduct = await Product.findOneAndUpdate(
//             {
//               url: product.url,
//             },
//             product,
//             { new: true } // Return the updated document
//           );

//           // ======================== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
//           const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);

//           if (emailNotifType && updatedProduct.users.length > 0) {
//             const productInfo = {
//               title: updatedProduct.title,
//               url: updatedProduct.url,
//             };
//             // Construct emailContent
//             const emailContent = await generateEmailBody(productInfo, emailNotifType);
//             // Get array of user emails
//             const userEmails = updatedProduct.users.map((user: any) => user.email);
//             // Send email notification
//             await sendEmail(emailContent, userEmails);
//           }

//           return updatedProduct;
//         } catch (err) {
//           console.error(`Error processing product URL: ${currentProduct.url}`, err);
//           return null;
//         }
//       })
//     );

//     return NextResponse.json({
//       message: "Ok",
//       data: updatedProducts.filter(product => product !== null), // Filter out any null entries
//     });
//   } catch (error: any) {
//     console.error("Failed to get all products:", error);
//     return NextResponse.json({
//       message: "Error",
//       error: error.message,
//     }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import {
  getLowestPrice,
  getHighestPrice,
  getAveragePrice,
  getEmailNotifType,
} from "@/lib/utils";
import { connectToDB } from "@/lib/scraper/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDB();

    const products = await Product.find({});
    if (!products || products.length === 0) {
      console.log("No products found in database.");
      return new Response("No products to process", { status: 200 });
    }

    let updatedCount = 0;
    let failedCount = 0;

    await Promise.all(
      products.map(async (currentProduct) => {
        try {
          const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

          if (!scrapedProduct?.currentPrice) {
            failedCount++;
            return;
          }

          const updatedPriceHistory = [
            ...currentProduct.priceHistory,
            {
              price: scrapedProduct.currentPrice,
              date: new Date(),
            },
          ];

          const product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
          };

          const updatedProduct = await Product.findOneAndUpdate(
            { url: product.url },
            product,
            { new: true }
          );

          const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);
          if (emailNotifType && updatedProduct?.users.length > 0) {
            const productInfo = {
              title: updatedProduct.title,
              url: updatedProduct.url,
              image: updatedProduct.image, // required for email templates
            };
            const emailContent = await generateEmailBody(productInfo, emailNotifType);
            const userEmails = updatedProduct.users.map((user: any) => user.email);
            await sendEmail(emailContent, userEmails);
          }

          updatedCount++;
        } catch (err) {
          console.error(`❌ Error scraping: ${currentProduct.url}`, err);
          failedCount++;
        }
      })
    );

    // ✅ Return only a small response
    return new Response(
      `✅ Cron finished. Updated: ${updatedCount}, Failed: ${failedCount}`,
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Cron failed:", error);
    return new Response("❌ Cron job error: " + error.message, { status: 500 });
  }
}
