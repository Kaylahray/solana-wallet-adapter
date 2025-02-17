"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { useEffect, useState } from "react";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export default function Home() {
  const { publicKey, sendTransaction } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingAirdrop, setIsLoadingAirdrop] = useState(false);
  const [isLoadingSend, setIsLoadingSend] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [mounted, setMounted] = useState(false);

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show the component after mounting
  if (!mounted) {
    return null;
  }

  const fetchBalance = async () => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
    setIsLoadingBalance(false);
  };

  const airdropSol = async () => {
    if (!publicKey) return;

    setIsLoadingAirdrop(true);
    try {
      const signature = await connection.requestAirdrop(
        publicKey,
        LAMPORTS_PER_SOL
      );
      setTxSignature(signature);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });
      alert("Airdrop successful! Click 'Get Balance' to update.");
    } catch (error) {
      console.error("Airdrop failed:", error);
    }
    setIsLoadingAirdrop(false);
  };

  const sendSol = async () => {
    if (!publicKey || !sendTransaction) return;

    try {
      setIsLoadingSend(true);

      // Validate recipient address
      const recipient = new PublicKey(recipientAddress);

      // Convert amount to lamports
      const lamports = parseFloat(sendAmount) * LAMPORTS_PER_SOL;
      // in thr tutorial it was +amount

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);

      // Confirm transaction
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      // Clear input fields
      setRecipientAddress("");
      setSendAmount("");
      await fetchBalance();
    } catch (error) {
      console.error("Error sending SOL:", error);
    } finally {
      setIsLoadingSend(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="border border-gray-300 bg-white shadow-lg rounded-lg p-6 w-full max-w-sm text-center">
        <WalletMultiButton className="!bg-orange-600 hover:!bg-orange-700 transition-all duration-200 !rounded-lg w-full" />

        <div className="mt-4 space-y-3">
          <button
            onClick={fetchBalance}
            disabled={!publicKey || isLoadingBalance}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 transition-all"
          >
            {isLoadingBalance ? "Fetching..." : "Get Balance"}
          </button>

          <button
            onClick={airdropSol}
            disabled={!publicKey || isLoadingAirdrop}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 transition-all"
          >
            {isLoadingAirdrop ? "Airdropping..." : "Airdrop 1 SOL"}
          </button>

          {/* Send SOL section */}
          <div className="space-y-2 pt-2">
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Amount in SOL"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              min="0"
              step="0.001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendSol}
              disabled={
                !publicKey || isLoadingSend || !recipientAddress || !sendAmount
              }
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-400 transition-all"
            >
              {isLoadingSend ? "Sending..." : "Send SOL"}
            </button>
          </div>

          {publicKey && (
            <p className="text-gray-700 font-medium">
              Balance:{" "}
              {solBalance !== null
                ? `${solBalance.toFixed(4)} SOL`
                : "Click 'Get Balance'"}
            </p>
          )}

          {txSignature && (
            <div className="mt-4 text-sm bg-gray-200 p-3 rounded-lg break-words">
              <span className="font-semibold">Transaction Signature:</span>
              <p className="text-blue-600 break-all">{txSignature}</p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block mt-2"
              >
                View on Solana Explorer
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
