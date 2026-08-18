/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-expect-error - static image asset
import collegeLogoImg from '../assets/images/kit_logo.png';

interface CollegeLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export default function CollegeLogo({ className = '', size = 120 }: CollegeLogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center bg-white rounded-full overflow-hidden p-0 border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.25)] select-none ${className}`} 
      style={{ width: size, height: size }}
    >
      <img
        src={collegeLogoImg}
        alt="KIT Coimbatore Logo"
        className="w-full h-full object-contain rounded-full"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

