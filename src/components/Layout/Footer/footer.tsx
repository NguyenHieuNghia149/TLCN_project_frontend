import React from 'react'
import { Link } from 'react-router-dom'
import {
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Bot, // For logo placeholder
} from 'lucide-react'
import './footer.scss'

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-border bg-card text-muted-foreground transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                AlgoForge
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-6">
              Master coding interviews with our comprehensive platform.
              Practice, learn, and compete with the best.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Platform
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6">
                  <li>
                    <Link
                      to="/dashboard"
                      className="transition-colors hover:text-primary"
                    >
                      Challenges
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/lessons"
                      className="transition-colors hover:text-primary"
                    >
                      Lessons
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/ranking"
                      className="transition-colors hover:text-primary"
                    >
                      Leaderboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/bookmarks"
                      className="transition-colors hover:text-primary"
                    >
                      Bookmarks
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Resources
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6">
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Community
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      API Docs
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Company
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6">
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Legal
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6">
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-primary"
                    >
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8 sm:mt-16 sm:flex sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            &copy; {new Date().getFullYear()} AlgoForge. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-6 sm:mt-0">
            <p className="text-xs text-muted-foreground">
              Built with React & Monaco Editor
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
