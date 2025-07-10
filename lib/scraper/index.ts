// "use server"

// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import { extractCurrency, extractDescription, extractPrice } from '../utils';

// export async function scrapeAmazonProduct(url: string) {
//   if(!url) return;

//   // BrightData proxy configuration
//   const username = String(process.env.BRIGHT_DATA_USERNAME);
//   const password = String(process.env.BRIGHT_DATA_PASSWORD);
//   const port = 22225;
//   const session_id = (1000000 * Math.random()) | 0;

//   const options = {
//     auth: {
//       username: `${username}-session-${session_id}`,
//       password,
//     },
//     host: 'brd.superproxy.io',
//     port,
//     rejectUnauthorized: false,
//   }

//   try {
//     // Fetch the product page
//     const response = await axios.get(url, options);
//     const $ = cheerio.load(response.data);

//     // Extract the product title
//     const title = $('#productTitle').text().trim();
//     const currentPrice = extractPrice(
//       $('.priceToPay span.a-price-whole'),
//       $('.a.size.base.a-color-price'),
//       $('.a-button-selected .a-color-base'),
//     );

//     const originalPrice = extractPrice(
//       $('#priceblock_ourprice'),
//       $('.a-price.a-text-price span.a-offscreen'),
//       $('#listPrice'),
//       $('#priceblock_dealprice'),
//       $('.a-size-base.a-color-price')
//     );

//     const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

//     const images = 
//       $('#imgBlkFront').attr('data-a-dynamic-image') || 
//       $('#landingImage').attr('data-a-dynamic-image') ||
//       '{}'

//     const imageUrls = Object.keys(JSON.parse(images));

//     const currency = extractCurrency($('.a-price-symbol'))
//     const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

//     const description = extractDescription($)

//     // Construct data object with scraped information
//     const data = {
//       url,
//       currency: currency || '$',
//       image: imageUrls[0],
//       title,
//       currentPrice: Number(currentPrice) || Number(originalPrice),
//       originalPrice: Number(originalPrice) || Number(currentPrice),
//       priceHistory: [],
//       discountRate: Number(discountRate),
//       category: 'category',
//       reviewsCount:100,
//       stars: 4.5,
//       isOutOfStock: outOfStock,
//       description,
//       lowestPrice: Number(currentPrice) || Number(originalPrice),
//       highestPrice: Number(originalPrice) || Number(currentPrice),
//       averagePrice: Number(currentPrice) || Number(originalPrice),
//     }
//     return data;
//   } catch (error: any) {
//     console.log(error);
//   }
// }
"use server"

import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription } from '../utils';

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  // Proxy config (Bright Data)
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
  }

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // ---------- Title ----------
    const title = $('#productTitle').text().trim();

    // ---------- Current Price (primary) ----------
    const priceText = $('span.a-price > span.a-offscreen').first().text().trim(); // e.g., $19.99 or ¥7,184
    const currentPrice = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '')) || 0;

    // ---------- Original Price (striked) ----------
    const originalText = $('.a-price.a-text-price span.a-offscreen').first().text().trim();
    const originalPrice = parseFloat(originalText.replace(/[^0-9.,]/g, '').replace(',', '')) || currentPrice;

    // ---------- Out of Stock ----------
    const availabilityText = $('#availability span').text().trim().toLowerCase();
    const isOutOfStock = availabilityText.includes('unavailable') || availabilityText.includes('out of stock');

    // ---------- Image ----------
    const imageData = $('#imgBlkFront').attr('data-a-dynamic-image') ||
                      $('#landingImage').attr('data-a-dynamic-image') || '{}';
    const imageUrls = Object.keys(JSON.parse(imageData));

    // ---------- Currency ----------
    const currencySymbol = $('.a-price-symbol').first().text().trim() || extractCurrency($('body')) || '$';

    // ---------- Discount ----------
    const discountText = $('.savingsPercentage').first().text().replace(/[-%]/g, '');
    const discountRate = parseFloat(discountText) || 0;

    // ---------- Description ----------
    const description = extractDescription($);

    // ---------- Final Fallbacks ----------
    const finalCurrent = currentPrice || originalPrice;
    const finalOriginal = originalPrice || currentPrice;

    // ---------- Data Object ----------
    return {
      url,
      currency: currencySymbol,
      image: imageUrls[0],
      title,
      currentPrice: finalCurrent,
      originalPrice: finalOriginal,
      priceHistory: [],
      discountRate,
      category: 'category',
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock,
      description,
      lowestPrice: finalCurrent,
      highestPrice: finalOriginal,
      averagePrice: finalCurrent,
    };
  } catch (error: any) {
    console.error("Scraping failed:", error.message);
    return null;
  }
}
