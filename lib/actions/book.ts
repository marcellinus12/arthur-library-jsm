"use server";

import { borrowRecords } from "./../../database/schema";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";

export const borrowBook = async (params: BorrowBookParams) => {
  const { bookId, userId } = params;

  try {
    const book = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book.length || book[0].availableCopies <= 0) {
      return {
        success: false,
        message: "Book is not available for borrowing",
      };
    }

    const dueDate = dayjs().add(7, "day").toDate().toDateString();

    const record = db.insert(borrowRecords).values({
      userId,
      bookId,
      dueDate,
      status: "BORROWED",
    });

    await db
      .update(books)
      .set({ availableCopies: book[0].availableCopies - 1 })
      .where(eq(books.id, bookId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(record)),
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "An error ocurred while borrowing the book",
    };
  }
};
