import {z} from "zod";

export const createChatSchema = z.object({
  title: z.string().min(4, {message: "Chat title must be 4 characters long"}).max(191, {message: "Chat title cannot be more than 191 characters."}),
  passcode: z.string().min(4, {message: "Chat passcode must be 4 charaters long"}).max(25, {message: "Chat passcode cananot be more than 25 characters"}),
}).required();

export type createChatSchemaType = z.infer<typeof createChatSchema>

