/**
 * ===========================================
 * Film Card Component
 * ===========================================
 * 
 * Card component for displaying film investment opportunities.
 */

import { Link } from 'react-router-dom';
import { Clock, TrendingUp, Users, ArrowRight } from 'lucide-react';
import Card from './Card';
import Button from './Button';

function FilmCard({ film }) {
  const { 
    _id, 
    title, 
    poster, 
    genre, 
    targetBudget, 
    currentFunding, 
    expectedROI, 
    fundingDeadline,
    totalInvestors,
    status 
  } = film;

  const fundingProgress = Math.round((currentFunding / targetBudget) * 100);
  const daysLeft = Math.ceil(
    (new Date(fundingDeadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const statusColors = {
    upcoming: 'badge-info',
    funding: 'badge-success',
    'in-production': 'badge-warning',
    completed: 'badge-success',
    released: 'badge-success',
  };

  return (
    <Card hover className="overflow-hidden">
      <Link to={`/films/${_id}`}>
        {/* Poster */}
        <div className="relative aspect-video bg-muted -mx-6 -mt-6 mb-4 overflow-hidden">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          <span className={`absolute top-2 right-2 ${statusColors[status]}`}>
            {status}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{title}</h3>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {genre?.slice(0, 3).map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Funding Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-medium">{fundingProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>${currentFunding?.toLocaleString()}</span>
            <span>${targetBudget?.toLocaleString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
            <span>{expectedROI}% ROI</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{totalInvestors} investors</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}</span>
          </div>
        </div>
      </Link>

      {/* Invest CTA */}
      <div className="mt-4 pt-4 border-t border-border">
        <Link to={`/films/${_id}`} className="block">
          {status === 'funding' && daysLeft > 0 ? (
            <Button variant="primary" className="w-full" size="sm">
              Invest Now <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="outline" className="w-full" size="sm">
              View Details <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </Link>
      </div>
    </Card>
  );
}

export default FilmCard;
