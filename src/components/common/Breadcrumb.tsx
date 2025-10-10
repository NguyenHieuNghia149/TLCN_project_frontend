import React from 'react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: string
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, separator = '›' }) => {
  if (!items || items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-gray-400">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && (
              <span className="mx-1 text-gray-500">{separator}</span>
            )}
            {item.to ? (
              <Link to={item.to} className="hover:text-blue-500">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-300">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb
