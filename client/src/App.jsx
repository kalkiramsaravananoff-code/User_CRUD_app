import { Toaster } from "react-hot-toast";
import UsersPage from "./app/UsersPage";

export default function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <UsersPage />
    </>
  );
}
