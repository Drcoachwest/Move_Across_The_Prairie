import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Copyright Section */}
          <div>
            <h3 className="text-white font-semibold mb-2">Move Across the Prairie</h3>
            <p className="text-sm">
              © {new Date().getFullYear()} All Rights Reserved.
            </p>
            <p className="text-xs mt-2 text-gray-400">
              Proprietary curriculum management system.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-2">Legal</h3>
            <ul className="text-sm space-y-1">
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Use
                </Link>
              </li>
              <li className="text-xs text-gray-400 mt-2">
                Confidential System for Educational Use Only
              </li>
            </ul>
          </div>

          {/* Ownership Notice */}
          <div>
            <h3 className="text-white font-semibold mb-2">Notice</h3>
            <p className="text-xs text-gray-400">
              This software is independently developed and owned. Unauthorized reproduction, 
              distribution, or use is strictly prohibited.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              <strong className="text-gray-300">Note:</strong> This project is not affiliated with, 
              endorsed by, or created by Grand Prairie ISD. All rights belong to the creator.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-400">
          <p>
            Unauthorized copying, modification, distribution, or use of this software is prohibited 
            and may result in legal action. For licensing inquiries, contact the owner.
          </p>
        </div>
      </div>
    </footer>
  );
}
