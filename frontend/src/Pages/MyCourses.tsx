import { useAuth } from '@/useAuth';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EnrolledCourseCard from '@/Components/EnrolledCourseCard';
import { useState } from 'react';
import ToggleView from '@/Components/ToggleView';
import SearchBar from '@/Components/inputs/SearchBar';
import DropdownControl from '@/Components/inputs/DropdownControl';
import { Tab } from '@/common';
import {
    ServerResponse,
    UserCourses,
    UserCoursesInfo,
    ViewType
} from '@/common';
import useSWR from 'swr';
import TabView from '@/Components/TabView';
import { AxiosError } from 'axios';

// TO DO: make sure this lives in the right place
const tabTypes = {
    Current: 'in_progress',
    Completed: 'completed',
    Favorited: 'is_favorited',
    All: 'all'
};

export default function MyCourses() {
    const tabs: Tab[] = [
        { name: 'Current', value: 'in_progress' },
        { name: 'Completed', value: 'completed' },
        { name: 'Favorited', value: 'is_favorited' },
        { name: 'All', value: 'all' }
    ];

    const { user } = useAuth();
    if (!user) return null;
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sort, setSort] = useState<string>('order=asc&order_by=course_name');
    const [activeTab, setActiveTab] = useState<Tab>(tabs[0]);
    const [activeView, setActiveView] = useState<ViewType>(ViewType.Grid);

    const { data, mutate, isLoading, error } = useSWR<
        ServerResponse<UserCoursesInfo>,
        AxiosError
    >(
        `/api/users/${user.id}/courses?${
            sort +
            (activeTab.value !== 'all' ? `&tags=${activeTab.value}` : '') +
            (searchTerm ? `&search=${searchTerm}` : '')
        }`
    );
    const courseData = data?.data as UserCoursesInfo;
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading courses.</div>;

    const handleChange = (newSearch: string) => {
        setSearchTerm(newSearch);
        // setPageQuery(1);
    };

    function handleDropdownChange(value: string) {
        setSort(value);
    }

    return (
        <AuthenticatedLayout title="My Courses" path={['My Courses']}>
            <div className="px-8 py-4">
                <h1>My Courses</h1>
                <TabView
                    tabs={tabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
                <div className="flex flex-row gap-16 w-100 border-b-2 border-grey-2 py-3">
                    {Object.entries(tabTypes).map(([k, v]) => (
                        <button
                            className={
                                activeTab.value === v
                                    ? 'text-teal-4 font-bold'
                                    : ''
                            }
                            onClick={() => setActiveTab({ name: k, value: v })}
                            key={k}
                        >
                            {k}
                        </button>
                    ))}
                </div>
                <div className="flex flex-row items-center mt-4 justify-between">
                    <div className="flex flex-row gap-x-2">
                        <SearchBar
                            searchTerm={searchTerm}
                            changeCallback={handleChange}
                        />
                        <DropdownControl
                            label="Sort by"
                            callback={handleDropdownChange}
                            enumType={{
                                'Name (A-Z)': 'order=asc&order_by=course_name',
                                'Name (Z-A)': 'order=desc&order_by=course_name',
                                'Progress (ascending)':
                                    'order=asc&order_by=course_progress',
                                'Progress (descending)':
                                    'order=desc&order_by=course_progress'
                            }}
                        />
                    </div>
                    <ToggleView
                        activeView={activeView}
                        setActiveView={setActiveView}
                    />
                </div>
                {/* render on gallery or list view */}
                <div
                    className={`grid mt-8 ${activeView == ViewType.Grid ? 'grid-cols-4 gap-6' : 'gap-4'}`}
                >
                    {courseData.courses.map(
                        (course: UserCourses, index: number) => {
                            return (
                                <EnrolledCourseCard
                                    course={course}
                                    view={activeView}
                                    callMutate={() => {
                                        void mutate();
                                    }}
                                    key={index}
                                />
                            );
                        }
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
