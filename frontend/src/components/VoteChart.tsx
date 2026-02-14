import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface VoteChartProps {
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
}

const COLORS = {
    For: '#22c55e',     // green-500
    Against: '#ef4444', // red-500
    Abstain: '#64748b'  // slate-500
};

export default function VoteChart({ forVotes, againstVotes, abstainVotes }: VoteChartProps) {
    const data = [
        { name: 'For', value: forVotes },
        { name: 'Against', value: againstVotes },
        { name: 'Abstain', value: abstainVotes }
    ].filter(item => item.value > 0);

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-slate-500 bg-slate-800/20 rounded-xl">
                No votes cast yet
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.name as keyof typeof COLORS]}
                                stroke="rgba(0,0,0,0.2)"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
