import React from 'react'

import '../../styles/components/SkillCard.scss'

interface SkillCardProps {
  title: string
  icon: React.ReactNode
  onClick?: () => void
}

const SkillCard: React.FC<SkillCardProps> = ({ title, icon, onClick }) => {
  return (
    <div className="practice-skill-card cursor-pointer" onClick={onClick}>
      <div className="practice-skill-card__row">
        <div className="practice-skill-card__icon">{icon}</div>
        <span className="practice-skill-card__title">{title}</span>
      </div>
    </div>
  )
}

export default SkillCard
