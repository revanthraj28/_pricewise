"use client";
import { scrapeAndStoreProduct } from "@/lib/actions";
import { parseUrl } from "next/dist/shared/lib/router/utils/parse-url";
import React, { FormEvent, useState } from "react";

const isValidAmazonProduxtURL = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;
    if (
      hostname.includes("amazon.com") ||
      hostname.includes("amazon.") ||
      hostname.endsWith("amazon")
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
};

const Searchbar = () => {
  const [searchPrompt, setsearchPrompt] = useState("");
  const [isLoading, setisLoading] = useState(false)

  const handlesubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidLink = isValidAmazonProduxtURL(searchPrompt);

    if(!isValidLink) return alert('Please provide a valid Amazon link')

    try {
        setisLoading(true);

        const product = await scrapeAndStoreProduct(searchPrompt);
    } catch (error) {
        console.log(error);
    } finally{
        setisLoading(false)
    }
  };

  return (
    <form className="flex flex-wrap gap-4 mt-12" onSubmit={handlesubmit}>
      <input
        type="text"
        value={searchPrompt}
        onChange={(e) => setsearchPrompt(e.target.value)}
        placeholder="Enter the product link"
        className="searchbar-input"
      />
      <button type="submit" className="searchbar-btn" disabled={searchPrompt === ''}>
        {isLoading ? "Searching..." : "Search"}
      </button>
    </form>
  );
};

export default Searchbar;
