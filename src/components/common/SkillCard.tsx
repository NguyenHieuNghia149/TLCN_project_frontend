import React from 'react'

import '../../styles/components/SkillCard.scss'

interface SkillCardProps {
  title: string
  icon: React.ReactNode
}

const SkillCard: React.FC<SkillCardProps> = ({ title, icon }) => {
  return (
    <div className="practice-skill-card cursor-pointer">
      <div className="practice-skill-card__row">
        <div className="practice-skill-card__icon">{icon}</div>
        <span className="practice-skill-card__title">{title}</span>
      </div>
    </div>
  )
}

export default SkillCard
